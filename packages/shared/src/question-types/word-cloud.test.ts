import { describe, expect, test } from 'vitest';
import { wordCloud } from './word-cloud';

describe('word-cloud config', () => {
  test('default allows three entries', () => {
    expect(wordCloud.defaultConfig()).toEqual({ maxEntries: 3 });
  });

  test('maxEntries must be an integer between 1 and 5', () => {
    expect(wordCloud.configSchema.safeParse({ maxEntries: 0 }).success).toBe(false);
    expect(wordCloud.configSchema.safeParse({ maxEntries: 6 }).success).toBe(false);
    expect(wordCloud.configSchema.safeParse({ maxEntries: 2.5 }).success).toBe(false);
    expect(wordCloud.configSchema.safeParse({ maxEntries: 5 }).success).toBe(true);
  });

  test('maxResponses follows the config', () => {
    expect(wordCloud.maxResponses({ maxEntries: 4 })).toBe(4);
  });
});

describe('word-cloud responses', () => {
  const schema = wordCloud.responseSchema({ maxEntries: 3 });

  test('trims and collapses whitespace', () => {
    expect(schema.parse({ text: '  hello   world ' })).toEqual({ text: 'hello world' });
  });

  test('rejects empty and over-long entries', () => {
    expect(schema.safeParse({ text: '   ' }).success).toBe(false);
    expect(schema.safeParse({ text: 'x'.repeat(26) }).success).toBe(false);
    expect(schema.safeParse({ text: 'x'.repeat(25) }).success).toBe(true);
  });
});

describe('word-cloud aggregate', () => {
  test('groups case-insensitively, keeps the first spelling and sorts by count', () => {
    const results = wordCloud.aggregate({ maxEntries: 3 }, [
      { text: 'Pizza' },
      { text: 'sushi' },
      { text: 'pizza' },
      { text: 'Sushi' },
      { text: 'PIZZA' },
      { text: 'kebab' },
    ]);
    expect(results).toEqual({
      words: [
        { text: 'Pizza', count: 3 },
        { text: 'sushi', count: 2 },
        { text: 'kebab', count: 1 },
      ],
      total: 6,
    });
  });

  test('groups Turkish dotted and dotless i', () => {
    const results = wordCloud.aggregate({ maxEntries: 3 }, [
      { text: 'İzmir' },
      { text: 'izmir' },
      { text: 'IZMIR' },
      { text: 'ılık' },
      { text: 'ILIK' },
    ]);
    expect(results.words).toEqual([
      { text: 'İzmir', count: 3 },
      { text: 'ılık', count: 2 },
    ]);
  });

  test('strips invisible characters before grouping', () => {
    const schema = wordCloud.responseSchema({ maxEntries: 3 });
    expect(schema.parse({ text: 'c\u200Bat' })).toEqual({ text: 'cat' });
    expect(schema.safeParse({ text: '\u200B\u200B' }).success).toBe(false);
  });

  test('breaks ties by first appearance', () => {
    const results = wordCloud.aggregate({ maxEntries: 3 }, [{ text: 'b' }, { text: 'a' }]);
    expect(results.words.map((w) => w.text)).toEqual(['b', 'a']);
  });

  test('keeps only the top 100 words', () => {
    const many = Array.from({ length: 150 }, (_, i) => ({ text: `w${i}` }));
    const results = wordCloud.aggregate({ maxEntries: 3 }, many);
    expect(results.words).toHaveLength(100);
    expect(results.total).toBe(150);
  });
});
