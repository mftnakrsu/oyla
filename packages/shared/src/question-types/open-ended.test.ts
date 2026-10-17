import { describe, expect, test } from 'vitest';
import { openEnded } from './open-ended';

describe('open-ended', () => {
  test('default allows one entry', () => {
    expect(openEnded.defaultConfig()).toEqual({ maxEntries: 1 });
    expect(openEnded.maxResponses({ maxEntries: 2 })).toBe(2);
  });

  test('accepts up to 280 characters after trimming', () => {
    const schema = openEnded.responseSchema({ maxEntries: 1 });
    expect(schema.parse({ text: '  Great talk!  ' })).toEqual({ text: 'Great talk!' });
    expect(schema.safeParse({ text: 'x'.repeat(281) }).success).toBe(false);
    expect(schema.safeParse({ text: '' }).success).toBe(false);
  });

  test('keeps line breaks inside an answer', () => {
    const schema = openEnded.responseSchema({ maxEntries: 1 });
    expect(schema.parse({ text: 'line one\nline two' })).toEqual({ text: 'line one\nline two' });
  });

  test('aggregates newest first with stable keys', () => {
    const results = openEnded.aggregate({ maxEntries: 1 }, [
      { text: 'first' },
      { text: 'second' },
      { text: 'third' },
    ]);
    expect(results).toEqual({
      entries: [
        { key: 2, text: 'third' },
        { key: 1, text: 'second' },
        { key: 0, text: 'first' },
      ],
      total: 3,
    });
  });

  test('keeps only the latest 200 answers', () => {
    const many = Array.from({ length: 250 }, (_, i) => ({ text: `a${i}` }));
    const results = openEnded.aggregate({ maxEntries: 1 }, many);
    expect(results.entries).toHaveLength(200);
    expect(results.entries[0]).toEqual({ key: 249, text: 'a249' });
    expect(results.total).toBe(250);
  });
});
