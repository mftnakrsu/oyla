import { describe, expect, test } from 'vitest';
import { generateJoinCode } from './join-codes';

describe('generateJoinCode', () => {
  test('returns six digits', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(generateJoinCode(() => false)).toMatch(/^\d{6}$/);
    }
  });

  test('skips codes that are taken', () => {
    const taken = new Set<string>();
    let calls = 0;
    const code = generateJoinCode((candidate) => {
      calls += 1;
      if (calls < 3) {
        taken.add(candidate);
        return true;
      }
      return false;
    });
    expect(taken.has(code)).toBe(false);
    expect(calls).toBe(3);
  });

  test('gives up when every code seems taken', () => {
    expect(() => generateJoinCode(() => true)).toThrow(/join code/);
  });
});
