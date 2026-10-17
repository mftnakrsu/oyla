import { describe, expect, test } from 'vitest';
import { randomId } from './ids';

describe('randomId', () => {
  test('defaults to 12 URL-safe characters', () => {
    expect(randomId()).toMatch(/^[A-Za-z0-9_-]{12}$/);
  });

  test('honours the requested length', () => {
    expect(randomId(24)).toHaveLength(24);
  });

  test('does not repeat', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => randomId()));
    expect(ids.size).toBe(1000);
  });
});
