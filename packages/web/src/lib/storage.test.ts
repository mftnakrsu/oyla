import { afterEach, describe, expect, test, vi } from 'vitest';
import { listMine, saveMine, tokenFor, updateMine } from './my-presentations';
import { getParticipantId } from './participant';
import { readJson, writeJson } from './storage';

afterEach(() => vi.restoreAllMocks());

describe('storage', () => {
  test('round-trips JSON', () => {
    writeJson('k', { a: 1 });
    expect(readJson('k', null)).toEqual({ a: 1 });
  });

  test('falls back when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readJson('k', 'fallback')).toBe('fallback');
    expect(() => writeJson('k', 1)).not.toThrow();
    expect(getParticipantId()).toMatch(/^[A-Za-z0-9_-]{24}$/);
  });

  test('falls back on corrupt JSON', () => {
    localStorage.setItem('k', '{nope');
    expect(readJson('k', 7)).toBe(7);
  });
});

describe('participant id', () => {
  test('is stable across calls', () => {
    expect(getParticipantId()).toBe(getParticipantId());
  });
});

describe('my presentations', () => {
  test('saves newest first, updates in place and finds tokens', () => {
    saveMine({ id: 'a', title: 'A', joinCode: '111111', adminToken: 'ta', createdAt: 1 });
    saveMine({ id: 'b', title: 'B', joinCode: '222222', adminToken: 'tb', createdAt: 2 });
    updateMine('a', { title: 'A2' });
    expect(listMine().map((p) => [p.id, p.title])).toEqual([
      ['b', 'B'],
      ['a', 'A2'],
    ]);
    expect(tokenFor('a')).toBe('ta');
    expect(tokenFor('zzz')).toBeNull();
  });
});
