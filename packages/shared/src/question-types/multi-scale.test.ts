import { describe, expect, test } from 'vitest';
import { multiScale } from './multi-scale';

const config = {
  min: 1 as const,
  max: 5,
  minLabel: 'Poor',
  maxLabel: 'Great',
  statements: [
    { id: 'pace', label: 'Pace' },
    { id: 'examples', label: 'Examples' },
  ],
};

describe('multi-scale', () => {
  test('the default config is valid', () => {
    expect(multiScale.configSchema.safeParse(multiScale.defaultConfig()).success).toBe(true);
  });

  test('takes 2 to 8 statements with unique ids', () => {
    const schema = multiScale.configSchema;
    const statements = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ id: `s${i}`, label: '' }));
    expect(schema.safeParse({ ...config, statements: statements(1) }).success).toBe(false);
    expect(schema.safeParse({ ...config, statements: statements(8) }).success).toBe(true);
    expect(schema.safeParse({ ...config, statements: statements(9) }).success).toBe(false);
    expect(
      schema.safeParse({
        ...config,
        statements: [
          { id: 'a', label: 'One' },
          { id: 'a', label: 'Two' },
        ],
      }).success,
    ).toBe(false);
  });

  test('a response rates every statement once, within the range', () => {
    const schema = multiScale.responseSchema(config);
    expect(schema.safeParse({ ratings: { pace: 4, examples: 5 } }).success).toBe(true);
    expect(schema.safeParse({ ratings: { pace: 4 } }).success).toBe(false);
    expect(schema.safeParse({ ratings: { pace: 4, examples: 5, other: 3 } }).success).toBe(false);
    expect(schema.safeParse({ ratings: { pace: 0, examples: 5 } }).success).toBe(false);
    expect(schema.safeParse({ ratings: { pace: 6, examples: 5 } }).success).toBe(false);
    expect(schema.safeParse({ ratings: { pace: 2.5, examples: 5 } }).success).toBe(false);
    expect(schema.safeParse({ ratings: { pace: 4, examples: 5 }, extra: 1 }).success).toBe(false);
  });

  test('averages per statement, skipping removed ones and counting added ones as empty', () => {
    const later = {
      ...config,
      statements: [...config.statements.slice(1), { id: 'slides', label: 'Slides' }],
    };
    expect(
      multiScale.aggregate(later, [
        { ratings: { pace: 2, examples: 4 } },
        { ratings: { pace: 5, examples: 5 } },
      ]),
    ).toEqual({
      statements: [
        { id: 'examples', average: 4.5, count: 2 },
        { id: 'slides', average: null, count: 0 },
      ],
      total: 2,
    });
  });

  test('describes an answer for the CSV', () => {
    expect(multiScale.describeResponse(config, { ratings: { pace: 4, examples: 5 } })).toBe(
      'Pace: 4; Examples: 5',
    );
    expect(
      multiScale.describeResponse(
        { ...config, statements: [{ id: 'pace', label: '' }] },
        { ratings: { pace: 4, gone: 1 } },
      ),
    ).toBe('#1: 4');
  });
});
