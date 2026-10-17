import { beforeEach, describe, expect, test } from 'vitest';
import { openDatabase } from './db/client';
import { createStore, type Store } from './store';

let store: Store;

function addPresentation(id = 'p1', joinCode = '123456', lastActivityAt = 1000) {
  store.presentations.insert({
    id,
    joinCode,
    title: 'Retro',
    adminTokenHash: 'hash',
    activeQuestionId: null,
    createdAt: 1000,
    updatedAt: 1000,
    lastActivityAt,
  });
}

function addQuestion(id: string, presentationId = 'p1') {
  return store.questions.insert({
    id,
    presentationId,
    position: store.questions.nextPosition(presentationId),
    type: 'word-cloud',
    title: id,
    config: { maxEntries: 3 },
    createdAt: 1000,
    updatedAt: 1000,
  });
}

beforeEach(() => {
  store = createStore(openDatabase(':memory:'));
});

describe('presentations', () => {
  test('round-trips and finds by join code', () => {
    addPresentation();
    expect(store.presentations.get('p1')?.title).toBe('Retro');
    expect(store.presentations.getByJoinCode('123456')?.id).toBe('p1');
    expect(store.presentations.joinCodeExists('123456')).toBe(true);
    expect(store.presentations.joinCodeExists('654321')).toBe(false);
    expect(store.presentations.get('missing')).toBeUndefined();
  });

  test('join codes are unique', () => {
    addPresentation('p1', '111111');
    expect(() => addPresentation('p2', '111111')).toThrow();
  });

  test('updates title, active question and activity time', () => {
    addPresentation();
    store.presentations.updateTitle('p1', 'New', 2000);
    store.presentations.setActiveQuestion('p1', 'q1', 3000);
    const row = store.presentations.get('p1');
    expect(row).toMatchObject({
      title: 'New',
      activeQuestionId: 'q1',
      updatedAt: 3000,
      lastActivityAt: 3000,
    });
    store.presentations.touch('p1', 4000);
    expect(store.presentations.get('p1')?.lastActivityAt).toBe(4000);
  });

  test('lists idle presentations', () => {
    addPresentation('old', '111111', 1000);
    addPresentation('new', '222222', 5000);
    expect(store.presentations.idleIds(2000)).toEqual(['old']);
  });

  test('deleting cascades to questions and responses', () => {
    addPresentation();
    addQuestion('q1');
    store.responses.insert('q1', 'participant-0001', { text: 'hi' }, 1000);
    store.presentations.delete('p1');
    expect(store.questions.list('p1')).toEqual([]);
    expect(store.responses.countForQuestion('q1')).toBe(0);
  });
});

describe('questions', () => {
  beforeEach(() => addPresentation());

  test('keeps insertion order through positions', () => {
    addQuestion('q1');
    addQuestion('q2');
    addQuestion('q3');
    expect(store.questions.list('p1').map((q) => [q.id, q.position])).toEqual([
      ['q1', 0],
      ['q2', 1],
      ['q3', 2],
    ]);
    expect(store.questions.count('p1')).toBe(3);
  });

  test('gets a question only within its presentation', () => {
    addPresentation('p2', '999999');
    addQuestion('q1');
    expect(store.questions.get('p1', 'q1')?.id).toBe('q1');
    expect(store.questions.get('p2', 'q1')).toBeUndefined();
  });

  test('updates title and config', () => {
    addQuestion('q1');
    store.questions.update(
      'p1',
      'q1',
      { title: 'Favourite food?', config: { maxEntries: 1 } },
      2000,
    );
    expect(store.questions.get('p1', 'q1')).toMatchObject({
      title: 'Favourite food?',
      config: { maxEntries: 1 },
      updatedAt: 2000,
    });
  });

  test('delete re-packs positions', () => {
    addQuestion('q1');
    addQuestion('q2');
    addQuestion('q3');
    store.questions.delete('p1', 'q2');
    expect(store.questions.list('p1').map((q) => [q.id, q.position])).toEqual([
      ['q1', 0],
      ['q3', 1],
    ]);
  });

  test('reorder applies the given order', () => {
    addQuestion('q1');
    addQuestion('q2');
    addQuestion('q3');
    store.questions.reorder('p1', ['q3', 'q1', 'q2'], 2000);
    expect(store.questions.list('p1').map((q) => q.id)).toEqual(['q3', 'q1', 'q2']);
  });
});

describe('responses', () => {
  beforeEach(() => {
    addPresentation();
    addQuestion('q1');
    addQuestion('q2');
  });

  test('stores payloads oldest first and counts them', () => {
    store.responses.insert('q1', 'aaaaaaaaaaaaaaaa', { text: 'one' }, 1000);
    store.responses.insert('q1', 'bbbbbbbbbbbbbbbb', { text: 'two' }, 1001);
    store.responses.insert('q1', 'aaaaaaaaaaaaaaaa', { text: 'three' }, 1002);
    expect(store.responses.payloads('q1')).toEqual([
      { text: 'one' },
      { text: 'two' },
      { text: 'three' },
    ]);
    expect(store.responses.countForQuestion('q1')).toBe(3);
    expect(store.responses.countForParticipant('q1', 'aaaaaaaaaaaaaaaa')).toBe(2);
    expect(store.responses.countForParticipant('q2', 'aaaaaaaaaaaaaaaa')).toBe(0);
  });

  test('counts per question for a presentation', () => {
    store.responses.insert('q1', 'aaaaaaaaaaaaaaaa', { text: 'one' }, 1000);
    store.responses.insert('q2', 'aaaaaaaaaaaaaaaa', { text: 'two' }, 1000);
    store.responses.insert('q2', 'bbbbbbbbbbbbbbbb', { text: 'three' }, 1000);
    const counts = store.responses.countsByPresentation('p1');
    expect(counts.get('q1')).toBe(1);
    expect(counts.get('q2')).toBe(2);
  });

  test('deletes all responses of a question', () => {
    store.responses.insert('q1', 'aaaaaaaaaaaaaaaa', { text: 'one' }, 1000);
    store.responses.deleteForQuestion('q1');
    expect(store.responses.countForQuestion('q1')).toBe(0);
  });

  test('transaction rolls back on error', () => {
    expect(() =>
      store.transaction(() => {
        store.responses.insert('q1', 'aaaaaaaaaaaaaaaa', { text: 'one' }, 1000);
        throw new Error('boom');
      }),
    ).toThrow('boom');
    expect(store.responses.countForQuestion('q1')).toBe(0);
  });
});
