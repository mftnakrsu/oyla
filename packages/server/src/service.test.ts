import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AppError } from './app-error';
import { loadConfig } from './config';
import { openDatabase } from './db/client';
import { createLiveEvents, type LiveEvents } from './events';
import { CLOSE_GRACE_MS, createPresentationService, type PresentationService } from './service';
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
    // Title and theme changes don't need a new participant state.
    const state = vi.fn();
    events.on('state-changed', state);
    service.update(created.id, { theme: 'navy' });
    expect(state).not.toHaveBeenCalled();
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
    expect(service.participantState(id, alice)).toEqual({
      activeQuestion: null,
      remaining: 0,
      results: null,
    });
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
      results: null,
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
      hidden: 0,
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

describe('results on phones', () => {
  function votedPoll() {
    const poll = pollPresentation();
    service.activate(poll.id, poll.questionId);
    service.submit(poll.id, alice, poll.questionId, { optionId: 'b' });
    return poll;
  }

  test('off by default: nobody gets results', () => {
    const { id } = votedPoll();
    expect(service.get(id).resultsOnPhones).toBe(false);
    expect(service.participantState(id, alice).results).toBeNull();
    expect(service.resultsAudience(id, service.activeQuestionId(id) ?? '')).toBeNull();
  });

  test('turned on: only participants who answered get them', () => {
    const { id, questionId } = votedPoll();
    const state = vi.fn();
    events.on('state-changed', state);
    expect(service.update(id, { resultsOnPhones: true }).resultsOnPhones).toBe(true);
    // Phones learn about it through a new state, not just the presentation info.
    expect(state).toHaveBeenCalledWith(id);

    const states = service.participantStates(id, [alice, bob]);
    expect(states.get(alice)?.results).toMatchObject({
      questionId,
      results: { counts: { a: 0, b: 1 }, total: 1 },
      total: 1,
    });
    expect(states.get(bob)?.results).toBeNull();
    expect(service.resultsAudience(id, questionId)).toEqual(new Set([alice]));
  });

  test('hidden results stay hidden on phones too', () => {
    const { id, questionId } = votedPoll();
    service.update(id, { resultsOnPhones: true });
    service.updateQuestion(id, questionId, { resultsHidden: true });
    expect(service.participantState(id, alice).results).toBeNull();
    expect(service.resultsAudience(id, questionId)).toBeNull();
  });

  test('only the active question’s results go to phones', () => {
    const { id, questionId } = votedPoll();
    service.update(id, { resultsOnPhones: true });
    service.activate(id, null);
    expect(service.resultsAudience(id, questionId)).toBeNull();
  });
});

describe('audience Q&A', () => {
  function qaSession() {
    const created = service.create({ title: 'All hands' });
    const question = service.addQuestion(created.id, {
      type: 'qa',
      title: 'Ask us anything',
      config: { maxEntries: 2 },
    });
    service.activate(created.id, question.id);
    return { ...created, questionId: question.id };
  }

  test('every phone sees the questions and its own responses, answered or not', () => {
    const { id, questionId } = qaSession();
    service.submit(id, alice, questionId, { text: 'Why Tuesdays?' });
    const states = service.participantStates(id, [alice, bob]);
    expect(states.get(bob)).toMatchObject({
      remaining: 2,
      mine: [],
      results: { results: { entries: [{ key: 'why tuesdays?', votes: 0 }], total: 1 } },
    });
    expect(states.get(alice)).toMatchObject({ remaining: 1, mine: [{ text: 'Why Tuesdays?' }] });
    expect(service.resultsAudience(id, questionId)).toBe('everyone');
    // The single-participant path gives the same answer.
    expect(service.participantState(id, alice)).toEqual(states.get(alice));
  });

  test('upvotes are free, once per question, and not for your own', () => {
    const { id, questionId } = qaSession();
    service.submit(id, alice, questionId, { text: 'Why Tuesdays?' });
    expect(service.submit(id, bob, questionId, { upvote: 'why tuesdays?' })).toEqual({
      remaining: 2,
    });
    expectAppError(
      () => service.submit(id, bob, questionId, { upvote: 'why tuesdays?' }),
      'VALIDATION_FAILED',
      400,
    );
    expectAppError(
      () => service.submit(id, alice, questionId, { upvote: 'why tuesdays?' }),
      'VALIDATION_FAILED',
      400,
    );
    const message = service.results(id, questionId);
    expect(message.total).toBe(1);
    expect(message.results).toEqual({
      entries: [{ key: 'why tuesdays?', text: 'Why Tuesdays?', votes: 1 }],
      total: 1,
    });
  });

  test('the question limit counts questions only', () => {
    const { id, questionId } = qaSession();
    service.submit(id, bob, questionId, { text: 'One?' });
    service.submit(id, alice, questionId, { upvote: 'one?' });
    service.submit(id, alice, questionId, { text: 'Two?' });
    expect(service.submit(id, alice, questionId, { text: 'Three?' })).toEqual({ remaining: 0 });
    expectAppError(
      () => service.submit(id, alice, questionId, { text: 'Four?' }),
      'RESPONSE_LIMIT_REACHED',
      409,
    );
  });

  test('hiding a question hides its upvotes, and hidden results stay off phones', () => {
    const { id, questionId } = qaSession();
    service.submit(id, alice, questionId, { text: 'Rude?' });
    service.submit(id, bob, questionId, { upvote: 'rude?' });
    service.hideEntry(id, questionId, 'rude?');
    expect(service.results(id, questionId)).toMatchObject({
      results: { entries: [], total: 0 },
      total: 0,
      hidden: 1,
    });
    service.updateQuestion(id, questionId, { resultsHidden: true });
    expect(service.participantState(id, bob).results).toBeNull();
    expect(service.resultsAudience(id, questionId)).toBeNull();
  });
});

describe('quiz', () => {
  const carol = 'carol-participant-01';

  function quizSession(seconds = 20) {
    const created = service.create({ title: 'Pub quiz' });
    const question = service.addQuestion(created.id, {
      type: 'quiz',
      title: 'Capital of Türkiye?',
      config: {
        options: [
          { id: 'a', label: 'Ankara' },
          { id: 'b', label: 'İstanbul' },
        ],
        correctOptionId: 'a',
        seconds,
      },
    });
    service.activate(created.id, question.id);
    return { ...created, questionId: question.id };
  }

  test('phones count down without the answer, and get it once time is up', () => {
    const { id } = quizSession();
    clock += 5000;
    const open = service.participantState(id, alice).activeQuestion;
    expect(open?.closesIn).toBe(15_000);
    expect(open?.config).not.toHaveProperty('correctOptionId');
    expect(service.presenterState(id).closesIn).toBe(15_000);

    clock += 15_000;
    const closed = service.participantState(id, alice).activeQuestion;
    expect(closed?.closesIn).toBe(0);
    expect(closed?.config).toMatchObject({ correctOptionId: 'a' });
  });

  test('answers score by correctness and server time, and are refused after the grace period', () => {
    const { id, questionId } = quizSession();
    clock += 10_000;
    service.submit(id, alice, questionId, { optionId: 'a' });
    service.submit(id, bob, questionId, { optionId: 'b' });
    clock += 10_000 + CLOSE_GRACE_MS;
    // Late but within the grace period: right, at the slowest score.
    service.submit(id, carol, questionId, { optionId: 'a' });
    clock += 1;
    expectAppError(
      () => service.submit(id, 'dave-participant-001', questionId, { optionId: 'a' }),
      'QUESTION_CLOSED',
      409,
    );

    expect(service.leaderboard(id)).toMatchObject({
      players: 3,
      entries: [
        { points: 750, rank: 1, name: null },
        { points: 500, rank: 2 },
        { points: 0, rank: 3 },
      ],
    });
    expect(service.participantState(id, bob).score).toEqual({
      points: 0,
      total: 0,
      rank: 3,
      players: 3,
    });
    expect(service.participantState(id, 'dave-participant-001').score).toEqual({
      points: null,
      total: 0,
      rank: null,
      players: 3,
    });
  });

  test('no score summary while the question is open', () => {
    const { id, questionId } = quizSession();
    service.submit(id, alice, questionId, { optionId: 'a' });
    expect(service.participantState(id, alice).score).toBeUndefined();
  });

  test('points add up over questions, ties share a place', () => {
    const { id, questionId } = quizSession();
    service.submit(id, alice, questionId, { optionId: 'a' });
    service.submit(id, bob, questionId, { optionId: 'a' });
    const second = service.addQuestion(id, {
      type: 'quiz',
      config: {
        options: [
          { id: 'x', label: 'X' },
          { id: 'y', label: 'Y' },
        ],
        correctOptionId: 'y',
        seconds: 10,
      },
    });
    service.activate(id, second.id);
    service.submit(id, bob, second.id, { optionId: 'y' });
    service.submit(id, carol, second.id, { optionId: 'y' });
    expect(service.leaderboard(id).entries.map((e) => [e.points, e.rank])).toEqual([
      [2000, 1],
      [1000, 2],
      [1000, 2],
    ]);
  });

  test('a presentation with a quiz asks for a nickname, which the presenter can hide', () => {
    const { id, questionId } = quizSession();
    expect(service.participantState(id, alice)).toMatchObject({
      askNickname: true,
      nickname: null,
    });
    service.setNickname(id, alice, 'Quick Eagle');
    expect(service.participantState(id, alice)).toMatchObject({
      askNickname: false,
      nickname: 'Quick Eagle',
    });
    service.submit(id, alice, questionId, { optionId: 'a' });
    const [entry] = service.leaderboard(id).entries;
    expect(entry?.name).toBe('Quick Eagle');

    service.hideNickname(id, entry?.id ?? 0);
    expect(service.leaderboard(id).entries[0]?.name).toBeNull();
    expectAppError(() => service.hideNickname(id, 999), 'NOT_FOUND', 404);
    // A new name clears the moderation.
    service.setNickname(id, alice, 'Calm Owl');
    expect(service.leaderboard(id).entries[0]?.name).toBe('Calm Owl');
  });

  test('presentations without a quiz never ask for a nickname', () => {
    const { id } = pollPresentation();
    expect(service.participantState(id, alice).askNickname).toBeUndefined();
  });

  test('the export includes points and visible nicknames', () => {
    const { id, questionId } = quizSession();
    service.setNickname(id, alice, 'Quick Eagle');
    service.setNickname(id, bob, 'Calm Owl');
    service.submit(id, alice, questionId, { optionId: 'a' });
    service.submit(id, bob, questionId, { optionId: 'b' });
    const aliceEntry = service.leaderboard(id).entries.find((entry) => entry.name === 'Quick Eagle');
    service.hideNickname(id, aliceEntry?.id ?? 0);

    const notes = service.addQuestion(id, { type: 'open-ended' });
    service.activate(id, notes.id);
    service.submit(id, bob, notes.id, { text: 'More breaks' });

    expect(
      service
        .exportResponses(id)
        .responses.map(({ participant, name, score }) => ({ participant, name, score })),
    ).toEqual([
      { participant: 1, name: null, score: 1000 },
      { participant: 2, name: 'Calm Owl', score: 0 },
      { participant: 2, name: 'Calm Owl', score: null },
    ]);
  });

  test('reopening or resetting the question restarts the clock', () => {
    const { id, questionId } = quizSession(10);
    clock += 30_000;
    expect(service.presenterState(id).closesIn).toBe(0);
    service.activate(id, questionId);
    expect(service.presenterState(id).closesIn).toBe(10_000);
    clock += 30_000;
    service.resetResults(id, questionId);
    expect(service.presenterState(id).closesIn).toBe(10_000);
  });
});

describe('moderation', () => {
  function cloudPresentation() {
    const { id } = service.create({ title: 'Retro' });
    const cloud = service.addQuestion(id, { type: 'word-cloud' }).id;
    service.activate(id, cloud);
    service.submit(id, alice, cloud, { text: 'Tea' });
    service.submit(id, alice, cloud, { text: 'rude' });
    service.submit(id, bob, cloud, { text: 'RUDE' });
    return { id, cloud };
  }
  const words = (id: string, question: string) =>
    (service.results(id, question).results as { words: { text: string }[] }).words.map(
      (word) => word.text,
    );

  test('a hidden word leaves the results with every spelling, and the count says so', () => {
    const { id, cloud } = cloudPresentation();
    const changed = vi.fn();
    events.on('results-changed', changed);
    service.hideEntry(id, cloud, 'rude');
    expect(changed).toHaveBeenCalledWith(id, cloud);
    expect(words(id, cloud)).toEqual(['Tea']);
    expect(service.results(id, cloud)).toMatchObject({ total: 1, hidden: 2 });
    // Sent again later, it stays hidden; hiding twice changes nothing.
    service.submit(id, bob, cloud, { text: 'Rude' });
    service.hideEntry(id, cloud, 'rude');
    expect(service.results(id, cloud)).toMatchObject({ total: 1, hidden: 3 });
  });

  test('hidden answers still use up the participant’s answers', () => {
    const { id, cloud } = cloudPresentation();
    service.hideEntry(id, cloud, 'rude');
    expect(service.participantState(id, alice).remaining).toBe(1);
  });

  test('showHidden brings everything back', () => {
    const { id, cloud } = cloudPresentation();
    service.hideEntry(id, cloud, 'tea');
    service.showHidden(id, cloud);
    expect(words(id, cloud)).toEqual(['rude', 'Tea']);
    expect(service.results(id, cloud).hidden).toBe(0);
  });

  test('reset clears the hidden list too', () => {
    const { id, cloud } = cloudPresentation();
    service.hideEntry(id, cloud, 'tea');
    service.resetResults(id, cloud);
    service.submit(id, alice, cloud, { text: 'tea' });
    expect(words(id, cloud)).toEqual(['tea']);
  });

  test('open answers can be hidden too, multiple choice cannot', () => {
    const { id } = service.create({ title: 'Retro' });
    const open = service.addQuestion(id, { type: 'open-ended' }).id;
    service.activate(id, open);
    service.submit(id, alice, open, { text: 'Spam spam' });
    service.hideEntry(id, open, 'spam spam');
    expect(service.results(id, open)).toMatchObject({ total: 0, hidden: 1 });

    const { id: pollId, questionId } = pollPresentation();
    expectAppError(() => service.hideEntry(pollId, questionId, 'a'), 'VALIDATION_FAILED', 400);
  });

  test('a question holds at most 500 hidden keys', () => {
    const { id, cloud } = cloudPresentation();
    for (let i = 0; i < 500; i += 1) service.hideEntry(id, cloud, `word ${i}`);
    expectAppError(() => service.hideEntry(id, cloud, 'one more'), 'VALIDATION_FAILED', 400);
  });

  test('the export marks hidden answers', () => {
    const { id, cloud } = cloudPresentation();
    service.hideEntry(id, cloud, 'rude');
    expect(service.exportResponses(id).responses.map((row) => row.hidden)).toEqual([
      false,
      true,
      true,
    ]);
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
    expect(service.participantState(id, alice)).toEqual({
      activeQuestion: null,
      remaining: 0,
      results: null,
    });
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
