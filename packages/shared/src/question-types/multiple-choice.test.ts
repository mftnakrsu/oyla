import { describe, expect, test } from 'vitest';
import { multipleChoice } from './multiple-choice';

const config = {
  options: [
    { id: 'a', label: 'Red' },
    { id: 'b', label: 'Blue' },
  ],
};

describe('multiple-choice config', () => {
  test('default config is valid and has two empty options with distinct ids', () => {
    const value = multipleChoice.defaultConfig();
    expect(multipleChoice.configSchema.safeParse(value).success).toBe(true);
    expect(value.options).toHaveLength(2);
    expect(value.options[0]?.id).not.toBe(value.options[1]?.id);
  });

  test('rejects fewer than 2 or more than 10 options', () => {
    expect(
      multipleChoice.configSchema.safeParse({ options: [{ id: 'a', label: 'x' }] }).success,
    ).toBe(false);
    const eleven = Array.from({ length: 11 }, (_, i) => ({ id: `o${i}`, label: `${i}` }));
    expect(multipleChoice.configSchema.safeParse({ options: eleven }).success).toBe(false);
  });

  test('rejects duplicate option ids and over-long labels', () => {
    const duplicate = {
      options: [
        { id: 'a', label: 'x' },
        { id: 'a', label: 'y' },
      ],
    };
    expect(multipleChoice.configSchema.safeParse(duplicate).success).toBe(false);
    const long = {
      options: [
        { id: 'a', label: 'x'.repeat(81) },
        { id: 'b', label: 'y' },
      ],
    };
    expect(multipleChoice.configSchema.safeParse(long).success).toBe(false);
  });

  test('allows empty labels while the presenter is still typing', () => {
    const blank = {
      options: [
        { id: 'a', label: '' },
        { id: 'b', label: '' },
      ],
    };
    expect(multipleChoice.configSchema.safeParse(blank).success).toBe(true);
  });
});

describe('multiple-choice responses', () => {
  test('accepts a known option and rejects unknown ones', () => {
    const schema = multipleChoice.responseSchema(config);
    expect(schema.safeParse({ optionId: 'a' }).success).toBe(true);
    expect(schema.safeParse({ optionId: 'zzz' }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
  });

  test('allows one answer per participant', () => {
    expect(multipleChoice.maxResponses(config)).toBe(1);
  });
});

describe('multiple-choice aggregate', () => {
  test('lists every option even without votes', () => {
    expect(multipleChoice.aggregate(config, [])).toEqual({ counts: { a: 0, b: 0 }, total: 0 });
  });

  test('counts votes and ignores votes for removed options', () => {
    const results = multipleChoice.aggregate(config, [
      { optionId: 'a' },
      { optionId: 'b' },
      { optionId: 'a' },
      { optionId: 'removed' },
    ]);
    expect(results).toEqual({ counts: { a: 2, b: 1 }, total: 3 });
  });
});
