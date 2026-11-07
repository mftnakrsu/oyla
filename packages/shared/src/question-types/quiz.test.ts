import { describe, expect, test } from 'vitest';
import { quiz, quizPoints } from './quiz';

const config = {
  options: [
    { id: 'a', label: 'Ankara' },
    { id: 'b', label: 'İstanbul' },
  ],
  correctOptionId: 'a',
  seconds: 20,
};

describe('quiz', () => {
  test('the default config is valid and marks an option as correct', () => {
    const defaults = quiz.defaultConfig();
    expect(quiz.configSchema.safeParse(defaults).success).toBe(true);
    expect(defaults.options.map((o) => o.id)).toContain(defaults.correctOptionId);
  });

  test('the correct answer must be an option, and the time stays in range', () => {
    expect(quiz.configSchema.safeParse({ ...config, correctOptionId: 'z' }).success).toBe(false);
    expect(quiz.configSchema.safeParse({ ...config, seconds: 2 }).success).toBe(false);
    expect(quiz.configSchema.safeParse({ ...config, seconds: 600 }).success).toBe(false);
  });

  test('phones never get the correct answer through the public config', () => {
    expect(quiz.toPublicConfig?.(config)).toEqual({ options: config.options, seconds: 20 });
  });

  test('right and fast scores most, right and slow half, wrong nothing', () => {
    expect(quizPoints(true, 0, 20)).toBe(1000);
    expect(quizPoints(true, 10_000, 20)).toBe(750);
    expect(quizPoints(true, 20_000, 20)).toBe(500);
    expect(quizPoints(true, 99_000, 20)).toBe(500);
    expect(quizPoints(false, 0, 20)).toBe(0);
    expect(quiz.score?.(config, { optionId: 'a' }, 0)).toBe(1000);
    expect(quiz.score?.(config, { optionId: 'b' }, 0)).toBe(0);
  });

  test('counts answers per option like multiple choice', () => {
    expect(
      quiz.aggregate(config, [{ optionId: 'a' }, { optionId: 'a' }, { optionId: 'x' }]),
    ).toEqual({ counts: { a: 2, b: 0 }, total: 2 });
    expect(quiz.timeLimit?.(config)).toBe(20);
  });
});
