import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AppError } from './app-error';
import { loadConfig } from './config';
import { openDatabase } from './db/client';
import { createLiveEvents, type LiveEvents } from './events';
import { createPresentationService, type PresentationService } from './service';
import { createStore, type Store } from './store';

const alice = 'alice-participant-01';
const bob = 'bob-participant-0001';

let store: Store;
let events: LiveEvents;
let service: PresentationService;
let clock: number;

function setup(env: NodeJS.ProcessEnv = {}) {
  store = createStore(openDatabase(':memory:'));
  events = createLiveEvents();
  clock = 1_000_000;
  service = createPresentationService({ store, events, config: loadConfig(env), now: () => clock });
}

function expectAppError(fn: () => unknown, code: string, status: number) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(code);
    expect((error as AppError).status).toBe(status);
    return;
  }
  throw new Error(`expected ${code}`);
}

function pollPresentation() {
  const created = service.create({ title: 'Retro' });
  const question = service.addQuestion(created.id, {
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

beforeEach(() => setup());

describe('creating and authenticating', () => {
  test('create returns an id, a 6-digit join code and an admin token', () => {
    const created = service.create({ title: 'Retro' });
    expect(created.id).toMatch(/^[A-Za-z0-9_-]{12}$/);
    expect(created.joinCode).toMatch(/^\d{6}$/);
    expect(service.authenticate(created.id, created.adminToken).id).toBe(created.id);
  });

  test('authenticate rejects a wrong token and unknown presentations', () => {
    const created = service.create({ title: 'Retro' });
    expectAppError(() => service.authenticate(created.id, 'wrong'), 'UNAUTHORIZED', 401);
    expectAppError(() => service.authenticate('missing', created.adminToken), 'NOT_FOUND', 404);
  });

  test('a configured create password is required and checked', () => {
    setup({ OYLA_CREATE_PASSWORD: 'letmein' });
    expectAppError(() => service.create({ title: 'Retro' }), 'CREATE_PASSWORD_REQUIRED', 401);
    expectAppError(
      () => service.create({ title: 'Retro', password: 'nope' }),
      'CREATE_PASSWORD_INVALID',
      403,
    );
    expect(service.create({ title: 'Retro', password: 'letmein' }).id).toBeTruthy();
  });

  test('get returns questions with response counts', () => {
    const { id, questionId } = pollPresentation();
    service.activate(id, questionId);
    service.submit(id, alice, questionId, { optionId: 'a' });
    const dto = service.get(id);
    expect(dto.title).toBe('Retro');
    expect(dto.activeQuestionId).toBe(questionId);
    expect(dto.questions).toHaveLength(1);
    expect(dto.questions[0]).toMatchObject({
      type: 'multiple-choice',
      title: 'Pick one',
      responseCount: 1,
    });
  });

  test('a new presentation uses the default theme', () => {
    const created = service.create({ title: 'Retro' });
    expect(service.get(created.id).theme).toBe('emerald');
    expect(service.info(created.id)).toEqual({ title: 'Retro', theme: 'emerald' });
  });

  test('update changes title and theme and tells the live layer', () => {
    const created = service.create({ title: 'Retro' });
    const changed = vi.fn();
    events.on('presentation-changed', changed);
    expect(service.update(created.id, { theme: 'indigo' })).toMatchObject({
      title: 'Retro',
      theme: 'indigo',
    });
    expect(service.update(created.id, { title: 'Planning' })).toMatchObject({
      title: 'Planning',
      theme: 'indigo',
    });
    expect(changed).toHaveBeenCalledTimes(2);
    expect(changed).toHaveBeenCalledWith(created.id);
  });

  test('rename and remove', () => {
    const created = service.create({ title: 'Retro' });
    expect(service.update(created.id, { title: 'Planning' }).title).toBe('Planning');
    const ended = vi.fn();
    events.on('presentation-ended', ended);
    service.remove(created.id);
    expect(ended).toHaveBeenCalledWith(created.id);
    expectAppError(() => service.get(created.id), 'NOT_FOUND', 404);
  });
});

describe('questions', () => {
  test('a new question gets the default config of its type', () => {
    const { id } = service.create({ title: 'Retro' });
    const question = service.addQuestion(id, { type: 'word-cloud' });
    expect(question).toMatchObject({
      type: 'word-cloud',
      title: '',
      config: { maxEntries: 3 },
      position: 0,
    });
  });

  test('invalid configs are rejected', () => {
    const { id } = service.create({ title: 'Retro' });
    expectAppError(
      () => service.addQuestion(id, { type: 'scale', config: { min: 5, max: 1 } }),
      'VALIDATION_FAILED',
      400,
    );
    const question = service.addQuestion(id, { type: 'scale' });
    expectAppError(
      () =>
        service.updateQuestion(id, question.id, {
          config: { min: 1, max: 99, minLabel: '', maxLabel: '' },
        }),
      'VALIDATION_FAILED',
      400,
    );
  });

  test('a presentation holds at most 50 questions', () => {
    const { id } = service.create({ title: 'Retro' });
    for (let i = 0; i < 50; i += 1) {
      service.addQuestion(id, { type: 'open-ended' });
    }
    expectAppError(
      () => service.addQuestion(id, { type: 'open-ended' }),
      'QUESTION_LIMIT_REACHED',
      409,
    );
  });

  test('updating the active question notifies the live layer', () => {
    const { id, questionId } = pollPresentation();
    service.activate(id, questionId);
    const state = vi.fn();
    const results = vi.fn();
    events.on('state-changed', state);
    events.on('results-changed', results);
    service.updateQuestion(id, questionId, { title: 'Pick one, quickly' });
    expect(state).toHaveBeenCalledWith(id);
    expect(results).toHaveBeenCalledWith(id, questionId);
  });

  test('deleting the active question clears it', () => {
    const { id, questionId } = pollPresentation();
    service.activate(id, questionId);
    service.deleteQuestion(id, questionId);
    expect(service.get(id).activeQuestionId).toBeNull();
    expectAppError(() => service.deleteQuestion(id, questionId), 'NOT_FOUND', 404);
  });

  test('reorder needs every question exactly once', () => {
    const { id } = service.create({ title: 'Retro' });
    const q1 = service.addQuestion(id, { type: 'open-ended' }).id;
    const q2 = service.addQuestion(id, { type: 'open-ended' }).id;
    expect(service.reorder(id, [q2, q1]).questions.map((q) => q.id)).toEqual([q2, q1]);
    expectAppError(() => service.reorder(id, [q1]), 'VALIDATION_FAILED', 400);
    expectAppError(() => service.reorder(id, [q1, q1]), 'VALIDATION_FAILED', 400);
    expectAppError(() => service.reorder(id, [q1, 'other']), 'VALIDATION_FAILED', 400);
  });

  test('questions of another presentation are not reachable', () => {
    const first = pollPresentation();
    const second = service.create({ title: 'Other' });
    expectAppError(
      () => service.updateQuestion(second.id, first.questionId, { title: 'x' }),
      'NOT_FOUND',
      404,
    );
    expectAppError(() => service.activate(second.id, first.questionId), 'NOT_FOUND', 404);
  });
});

describe('live sessions', () => {
  test('joinByCode finds the presentation or fails with JOIN_CODE_NOT_FOUND', () => {
    const { id, joinCode } = service.create({ title: 'Retro' });
    expect(service.joinByCode(joinCode).id).toBe(id);
    const unknown = joinCode === '000000' ? '000001' : '000000';
    expectAppError(() => service.joinByCode(unknown), 'JOIN_CODE_NOT_FOUND', 404);
  });

  test('participant state shows the active question in public form', () => {
    const { id, questionId } = pollPresentation();
    expect(service.participantState(id, alice)).toEqual({ activeQuestion: null, remaining: 0 });
    service.activate(id, questionId);
    expect(service.participantState(id, alice)).toEqual({
      activeQuestion: {
        id: questionId,
        type: 'multiple-choice',
        title: 'Pick one',
        config: {
          options: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
          ],
        },
        index: 0,
        total: 1,
      },
      remaining: 1,
    });
  });

  test('submit enforces the active question, the schema and the answer limit', () => {
    const { id, questionId } = pollPresentation();
    expectAppError(
      () => service.submit(id, alice, questionId, { optionId: 'a' }),
      'QUESTION_NOT_ACTIVE',
      409,
    );
    service.activate(id, questionId);
    expectAppError(
      () => service.submit(id, alice, questionId, { optionId: 'zzz' }),
      'VALIDATION_FAILED',
      400,
    );
    expect(service.submit(id, alice, questionId, { optionId: 'a' })).toEqual({ remaining: 0 });
    expectAppError(
      () => service.submit(id, alice, questionId, { optionId: 'b' }),
      'RESPONSE_LIMIT_REACHED',
      409,
    );
    expect(service.participantState(id, alice).remaining).toBe(0);
    expect(service.participantState(id, bob).remaining).toBe(1);
  });

  test('submit stores the parsed payload and announces new results', () => {
    const { id } = service.create({ title: 'Retro' });
    const cloud = service.addQuestion(id, { type: 'word-cloud' }).id;
    service.activate(id, cloud);
    const results = vi.fn();
    events.on('results-changed', results);
    expect(service.submit(id, alice, cloud, { text: '  hello   there ' })).toEqual({
      remaining: 2,
    });
    expect(results).toHaveBeenCalledWith(id, cloud);
    expect(service.results(id, cloud)).toEqual({
      questionId: cloud,
      results: { words: [{ text: 'hello there', count: 1 }], total: 1 },
      total: 1,
    });
  });

  test('a question stops accepting answers when full', () => {
    const { id } = service.create({ title: 'Retro' });
    const open = service.addQuestion(id, { type: 'open-ended' }).id;
    service.activate(id, open);
    for (let i = 0; i < 2000; i += 1) {
      store.responses.insert(
        open,
        `participant-${String(i).padStart(8, '0')}`,
        { text: 'x' },
        clock,
      );
    }
    expectAppError(() => service.submit(id, alice, open, { text: 'late' }), 'QUESTION_FULL', 409);
  });

  test('reset clears results and gives participants their answers back', () => {
    const { id, questionId } = pollPresentation();
    service.activate(id, questionId);
    service.submit(id, alice, questionId, { optionId: 'a' });
    service.resetResults(id, questionId);
    expect(service.results(id, questionId).total).toBe(0);
    expect(service.participantState(id, alice).remaining).toBe(1);
  });

  test('activity keeps a presentation alive', () => {
    const { id, questionId } = pollPresentation();
    clock += 5000;
    service.activate(id, questionId);
    expect(store.presentations.get(id)?.lastActivityAt).toBe(clock);
    clock += 5000;
    service.submit(id, alice, questionId, { optionId: 'a' });
    expect(store.presentations.get(id)?.lastActivityAt).toBe(clock);
  });

  test('activate emits state-changed and accepts null', () => {
    const { id, questionId } = pollPresentation();
    const state = vi.fn();
    events.on('state-changed', state);
    service.activate(id, questionId);
    service.activate(id, null);
    expect(state).toHaveBeenCalledTimes(2);
    expect(service.get(id).activeQuestionId).toBeNull();
  });
});

describe('hardening', () => {
  test('participantStates answers many participants at once, like participantState', () => {
    const { id, questionId } = pollPresentation();
    service.activate(id, questionId);
    service.submit(id, alice, questionId, { optionId: 'a' });
    const states = service.participantStates(id, [alice, bob]);
    expect(states.get(alice)).toEqual(service.participantState(id, alice));
    expect(states.get(alice)?.remaining).toBe(0);
    expect(states.get(bob)?.remaining).toBe(1);
  });

  test('a stored config that no longer parses makes the question unavailable instead of inventing one', () => {
    const { id, questionId } = pollPresentation();
    store.questions.update(id, questionId, { config: { options: 'broken' } }, clock);
    service.activate(id, questionId);
    expect(service.participantState(id, alice)).toEqual({ activeQuestion: null, remaining: 0 });
    expectAppError(
      () => service.submit(id, alice, questionId, { optionId: 'a' }),
      'VALIDATION_FAILED',
      400,
    );
    expect(service.results(id, questionId).results).toBeNull();
  });

  test('joining does not extend a presentation’s life; answering does', () => {
    const { id, joinCode, questionId } = pollPresentation();
    const before = store.presentations.get(id)?.lastActivityAt;
    clock += 60_000;
    service.joinByCode(joinCode);
    expect(store.presentations.get(id)?.lastActivityAt).toBe(before);
    service.activate(id, questionId);
    clock += 60_000;
    service.submit(id, alice, questionId, { optionId: 'a' });
    expect(store.presentations.get(id)?.lastActivityAt).toBe(clock);
  });

  test('a presentation stops accepting answers at the per-presentation cap', () => {
    const { id, questionId } = pollPresentation();
    const other = service.addQuestion(id, { type: 'open-ended' }).id;
    store.transaction(() => {
      for (let i = 0; i < 20_000; i += 1) {
        store.responses.insert(
          questionId,
          `participant-${String(i).padStart(8, '0')}`,
          { optionId: 'a' },
          clock,
        );
      }
    });
    service.activate(id, other);
    expectAppError(
      () => service.submit(id, alice, other, { text: 'late' }),
      'PRESENTATION_FULL',
      409,
    );
  });

  test('reset announces that the answers of a question were cleared', () => {
    const { id, questionId } = pollPresentation();
    const cleared = vi.fn();
    events.on('responses-cleared', cleared);
    service.resetResults(id, questionId);
    expect(cleared).toHaveBeenCalledWith(id, questionId);
  });
});
