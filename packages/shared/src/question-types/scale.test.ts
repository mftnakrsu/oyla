import { describe, expect, test } from 'vitest';
import { type ScaleConfig, scale } from './scale';

const config: ScaleConfig = { min: 1, max: 5, minLabel: 'Bad', maxLabel: 'Great' };

describe('scale config', () => {
  test('default is 1 to 5 without labels', () => {
    expect(scale.defaultConfig()).toEqual({ min: 1, max: 5, minLabel: '', maxLabel: '' });
  });

  test('min is 0 or 1 and max is 2 to 10', () => {
    expect(scale.configSchema.safeParse({ ...config, min: 2 }).success).toBe(false);
    expect(scale.configSchema.safeParse({ ...config, max: 11 }).success).toBe(false);
    expect(scale.configSchema.safeParse({ ...config, max: 1 }).success).toBe(false);
    expect(scale.configSchema.safeParse({ ...config, min: 0, max: 10 }).success).toBe(true);
  });

  test('labels are limited to 40 characters', () => {
    expect(scale.configSchema.safeParse({ ...config, minLabel: 'x'.repeat(41) }).success).toBe(
      false,
    );
  });
});

describe('scale responses', () => {
  test('accepts integers inside the range only', () => {
    const schema = scale.responseSchema(config);
    expect(schema.safeParse({ value: 1 }).success).toBe(true);
    expect(schema.safeParse({ value: 5 }).success).toBe(true);
    expect(schema.safeParse({ value: 0 }).success).toBe(false);
    expect(schema.safeParse({ value: 6 }).success).toBe(false);
    expect(schema.safeParse({ value: 2.5 }).success).toBe(false);
    expect(scale.maxResponses(config)).toBe(1);
  });
});

describe('scale aggregate', () => {
  test('empty results have no average', () => {
    expect(scale.aggregate(config, [])).toEqual({
      distribution: [0, 0, 0, 0, 0],
      average: null,
      total: 0,
    });
  });

  test('builds the distribution and average, ignoring values outside a changed range', () => {
    const results = scale.aggregate(config, [
      { value: 5 },
      { value: 4 },
      { value: 4 },
      { value: 9 },
    ]);
    expect(results.distribution).toEqual([0, 0, 0, 2, 1]);
    expect(results.total).toBe(3);
    expect(results.average).toBeCloseTo(13 / 3);
  });
});
