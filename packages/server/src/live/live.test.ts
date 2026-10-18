import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type {
  Ack,
  ClientToServerEvents,
  CreatePresentationResult,
  ParticipantJoinAck,
  ParticipantState,
  PresenterJoinAck,
  QuestionDto,
  ResponseSubmitAck,
  ResultsMessage,
  ServerToClientEvents,
} from '@oyla/shared';
import { io as connect, type Socket } from 'socket.io-client';
import { afterEach, describe, expect, test } from 'vitest';
import type { BuiltApp } from '../app';
import type { AppConfig } from '../config';
import { startTestApp } from '../test-helpers';

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const running: BuiltApp[] = [];
const sockets: ClientSocket[] = [];

afterEach(async () => {
  for (const socket of sockets.splice(0)) socket.disconnect();
  for (const built of running.splice(0)) await built.close();
});

async function start(overrides: Partial<AppConfig> = {}) {
  const built = await startTestApp(overrides);
  running.push(built);
  await built.app.listen({ port: 0, host: '127.0.0.1' });
  const address = built.app.server.address();
  if (!address || typeof address === 'string') throw new Error('no port');
  return { built, url: `http://127.0.0.1:${address.port}` };
}

async function client(url: string): Promise<ClientSocket> {
  const socket: ClientSocket = connect(url, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });
  sockets.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', reject);
  });
  return socket;
}

function emit<T>(
  socket: ClientSocket,
  event: keyof ClientToServerEvents,
  payload: unknown,
): Promise<T> {
  return new Promise((resolve) => {
    // biome-ignore lint/suspicious/noExplicitAny: test helper over every event signature
    (socket.emit as any)(event, payload, (result: T) => resolve(result));
  });
}

function next<E extends keyof ServerToClientEvents>(
  socket: ClientSocket,
  event: E,
  predicate: (...args: Parameters<ServerToClientEvents[E]>) => boolean = () => true,
  timeout = 2000,
): Promise<Parameters<ServerToClientEvents[E]>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), timeout);
    const listener = (...args: Parameters<ServerToClientEvents[E]>) => {
      if (predicate(...args)) {
        clearTimeout(timer);
        // biome-ignore lint/suspicious/noExplicitAny: socket.io listener typing
        socket.off(event, listener as any);
        resolve(args);
      }
    };
    // biome-ignore lint/suspicious/noExplicitAny: socket.io listener typing
    socket.on(event, listener as any);
  });
}

async function setupPoll(built: BuiltApp) {
  const created = built.service.create({ title: 'Retro' });
  const question = built.service.addQuestion(created.id, {
    type: 'multiple-choice',
    title: 'Pick one',
    config: {
      options: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
    },
  });
  return { ...created, questionId: question.id };
}

const participant = (n: number) => `participant-id-${String(n).padStart(4, '0')}`;

describe('joining', () => {
  test('participants need an existing code', async () => {
    const { url } = await start();
    const socket = await client(url);
    const ack = await emit<ParticipantJoinAck>(socket, 'participant:join', {
      joinCode: '000000',
      participantId: participant(1),
    });
    expect(ack).toEqual({ ok: false, error: { code: 'JOIN_CODE_NOT_FOUND' } });
  });

  test('malformed payloads are rejected', async () => {
    const { url } = await start();
    const socket = await client(url);
    const ack = await emit<ParticipantJoinAck>(socket, 'participant:join', { joinCode: 'abc' });
    expect(ack).toEqual({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    const nothing = await emit<ParticipantJoinAck>(socket, 'participant:join', null);
    expect(nothing).toEqual({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });

  test('presenters need the admin token', async () => {
    const { built, url } = await start();
    const { id } = await setupPoll(built);
    const socket = await client(url);
    const ack = await emit<PresenterJoinAck>(socket, 'presenter:join', {
      presentationId: id,
      adminToken: 'wrong',
    });
    expect(ack).toEqual({ ok: false, error: { code: 'UNAUTHORIZED' } });
  });

  test('participants cannot run presenter commands', async () => {
    const { built, url } = await start();
    const { joinCode, questionId } = await setupPoll(built);
    const socket = await client(url);
    await emit(socket, 'participant:join', { joinCode, participantId: participant(1) });
    const ack = await emit<Ack>(socket, 'presenter:activate', { questionId });
    expect(ack).toEqual({ ok: false, error: { code: 'UNAUTHORIZED' } });
  });
});

describe('a live poll', () => {
  test('votes reach the presenter as results and presence', async () => {
    const { built, url } = await start();
    const { id, joinCode, adminToken, questionId } = await setupPoll(built);

    const presenter = await client(url);
    const joined = await emit<PresenterJoinAck>(presenter, 'presenter:join', {
      presentationId: id,
      adminToken,
    });
    expect(joined).toMatchObject({
      ok: true,
      title: 'Retro',
      activeQuestionId: null,
      participants: 0,
      results: null,
    });

    const alice = await client(url);
    const bob = await client(url);
    const presence = next(presenter, 'presence', (p) => p.participants === 2);
    const aliceJoin = await emit<ParticipantJoinAck>(alice, 'participant:join', {
      joinCode,
      participantId: participant(1),
    });
    expect(aliceJoin).toMatchObject({
      ok: true,
      presentationId: id,
      title: 'Retro',
      state: { activeQuestion: null },
    });
    await emit(bob, 'participant:join', { joinCode, participantId: participant(2) });
    await presence;

    const aliceState = next(
      alice,
      'state',
      (s: ParticipantState) => s.activeQuestion?.id === questionId,
    );
    const presenterState = next(
      presenter,
      'presenter:state',
      (s) => s.activeQuestionId === questionId,
    );
    expect(await emit<Ack>(presenter, 'presenter:activate', { questionId })).toEqual({ ok: true });
    const [state] = await aliceState;
    expect(state.remaining).toBe(1);
    await presenterState;

    const results = next(presenter, 'results', (r: ResultsMessage) => r.total === 2);
    expect(
      await emit<ResponseSubmitAck>(alice, 'response:submit', {
        questionId,
        response: { optionId: 'a' },
      }),
    ).toEqual({
      ok: true,
      remaining: 0,
    });
    await emit(bob, 'response:submit', { questionId, response: { optionId: 'a' } });
    const [message] = await results;
    expect(message.results).toEqual({ counts: { a: 2, b: 0 }, total: 2 });

    const again = await emit<ResponseSubmitAck>(alice, 'response:submit', {
      questionId,
      response: { optionId: 'b' },
    });
    expect(again).toEqual({ ok: false, error: { code: 'RESPONSE_LIMIT_REACHED' } });

    const left = next(presenter, 'presence', (p) => p.participants === 1);
    bob.disconnect();
    await left;
  });

  test('a reconnecting participant keeps their answers', async () => {
    const { built, url } = await start();
    const { id, joinCode, questionId } = await setupPoll(built);
    built.service.activate(id, questionId);
    const first = await client(url);
    await emit(first, 'participant:join', { joinCode, participantId: participant(1) });
    await emit(first, 'response:submit', { questionId, response: { optionId: 'b' } });
    first.disconnect();

    const second = await client(url);
    const ack = await emit<ParticipantJoinAck>(second, 'participant:join', {
      joinCode,
      participantId: participant(1),
    });
    expect(ack.ok && ack.state.remaining).toBe(0);
  });

  test('reset clears results and returns answers to participants', async () => {
    const { built, url } = await start();
    const { id, joinCode, adminToken, questionId } = await setupPoll(built);
    built.service.activate(id, questionId);
    const presenter = await client(url);
    await emit(presenter, 'presenter:join', { presentationId: id, adminToken });
    const alice = await client(url);
    await emit(alice, 'participant:join', { joinCode, participantId: participant(1) });
    await emit(alice, 'response:submit', { questionId, response: { optionId: 'a' } });

    const cleared = next(presenter, 'results', (r: ResultsMessage) => r.total === 0);
    const refreshed = next(alice, 'state', (s: ParticipantState) => s.remaining === 1);
    expect(await emit<Ack>(presenter, 'presenter:reset', { questionId })).toEqual({ ok: true });
    await cleared;
    await refreshed;
  });

  test('presenter join returns the results of the active question', async () => {
    const { built, url } = await start();
    const { id, adminToken, questionId } = await setupPoll(built);
    built.service.activate(id, questionId);
    built.service.submit(id, participant(1), questionId, { optionId: 'b' });
    const presenter = await client(url);
    const ack = await emit<PresenterJoinAck>(presenter, 'presenter:join', {
      presentationId: id,
      adminToken,
    });
    expect(ack.ok && ack.results).toEqual({
      questionId,
      results: { counts: { a: 0, b: 1 }, total: 1 },
      total: 1,
    });
  });

  test('editing the active question over REST updates participants', async () => {
    const { built, url } = await start();
    const { id, joinCode, adminToken, questionId } = await setupPoll(built);
    built.service.activate(id, questionId);
    const alice = await client(url);
    await emit(alice, 'participant:join', { joinCode, participantId: participant(1) });
    const renamed = next(
      alice,
      'state',
      (s: ParticipantState) => s.activeQuestion?.title === 'Renamed',
    );
    const res = await built.app.inject({
      method: 'PATCH',
      url: `/api/presentations/${id}/questions/${questionId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { title: 'Renamed' },
    });
    expect(res.json<QuestionDto>().title).toBe('Renamed');
    await renamed;
  });

  test('deleting the presentation ends it for everyone', async () => {
    const { built, url } = await start();
    const { id, joinCode, adminToken } = await setupPoll(built);
    const alice = await client(url);
    await emit(alice, 'participant:join', { joinCode, participantId: participant(1) });
    const ended = next(alice, 'presentation:ended');
    await built.app.inject({
      method: 'DELETE',
      url: `/api/presentations/${id}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    await ended;
  });

  test('submitting too fast is rate limited', async () => {
    const { built, url } = await start();
    const { id } = built.service.create({ title: 'Cloud' });
    const cloud = built.service.addQuestion(id, { type: 'word-cloud', config: { maxEntries: 5 } });
    built.service.activate(id, cloud.id);
    const { joinCode } = built.store.presentations.get(id) ?? { joinCode: '' };
    const alice = await client(url);
    await emit(alice, 'participant:join', { joinCode, participantId: participant(1) });
    const acks = await Promise.all(
      Array.from({ length: 15 }, () =>
        emit<ResponseSubmitAck>(alice, 'response:submit', {
          questionId: cloud.id,
          response: { text: 'x' },
        }),
      ),
    );
    expect(acks.some((a) => !a.ok && a.error.code === 'RATE_LIMITED')).toBe(true);
  });
});

describe('abuse limits', () => {
  test('a page on another origin cannot open a socket', async () => {
    const { url } = await start();
    const socket: ClientSocket = connect(url, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      extraHeaders: { origin: 'https://evil.example' },
    });
    sockets.push(socket);
    const error = await new Promise<Error>((resolve) => socket.once('connect_error', resolve));
    expect(error).toBeInstanceOf(Error);
    expect(socket.connected).toBe(false);
  });

  test('guessing join codes from new sockets is limited per IP, real codes are not', async () => {
    const { built, url } = await start();
    const { joinCode } = await setupPoll(built);
    const wrong = joinCode === '000000' ? '000001' : '000000';
    const codes: string[] = [];
    for (let i = 0; i < 21; i += 1) {
      const socket = await client(url);
      const ack = await emit<ParticipantJoinAck>(socket, 'participant:join', {
        joinCode: wrong,
        participantId: participant(i),
      });
      codes.push(ack.ok ? 'ok' : ack.error.code);
      socket.disconnect();
    }
    expect(codes.slice(0, 20).every((code) => code === 'JOIN_CODE_NOT_FOUND')).toBe(true);
    expect(codes[20]).toBe('RATE_LIMITED');
  });
});

describe('persistence', () => {
  test('a restart keeps the active question', async () => {
    const dbPath = join(mkdtempSync(join(tmpdir(), 'oyla-db-')), 'oyla.db');
    const first = await start({ dbPath });
    const created: CreatePresentationResult & { questionId: string } = await setupPoll(first.built);
    first.built.service.activate(created.id, created.questionId);
    await first.built.close();
    running.splice(running.indexOf(first.built), 1);

    const second = await start({ dbPath });
    const socket = await client(second.url);
    const ack = await emit<ParticipantJoinAck>(socket, 'participant:join', {
      joinCode: created.joinCode,
      participantId: participant(1),
    });
    expect(ack.ok && ack.state.activeQuestion?.id).toBe(created.questionId);
  });
});
