import { describe, expect, test } from 'vitest';
import { orientationOf, sizeOf, tierOf } from './layout';

const sample = Array.from({ length: 200 }, (_, i) => `word-${i}`);

describe('word cloud layout', () => {
  test('a word keeps its orientation, and the most common one stays horizontal', () => {
    for (const word of sample) {
      expect(orientationOf(word, 3)).toBe(orientationOf(word, 3));
      expect(orientationOf(word, 0)).toBe(0);
    }
  });

  test('roughly four in ten words turn, both ways', () => {
    const turned = sample.map((word) => orientationOf(word, 1));
    const vertical = turned.filter((o) => o !== 0).length / sample.length;
    expect(vertical).toBeGreaterThan(0.25);
    expect(vertical).toBeLessThan(0.55);
    expect(turned).toContain(90);
    expect(turned).toContain(-90);
  });

  test('size grows with the count across the whole range', () => {
    expect(sizeOf(1, 10, 14, 120)).toBe(14);
    expect(sizeOf(10, 10, 14, 120)).toBe(120);
    expect(sizeOf(5, 10, 14, 120)).toBeLessThan(sizeOf(6, 10, 14, 120));
    expect(sizeOf(1, 1, 14, 120)).toBe(67);
  });

  test('tiers follow the share of the most common word', () => {
    expect(tierOf(10, 10)).toBe(1);
    expect(tierOf(5, 10)).toBe(2);
    expect(tierOf(1, 10)).toBe(3);
  });
});
