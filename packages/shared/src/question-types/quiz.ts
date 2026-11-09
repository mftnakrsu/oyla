import { z } from 'zod';
import { randomId } from '../ids';
import { LIMITS } from '../limits';
import { textField } from '../text';
import { defineQuestionType } from './define';

const optionSchema = z.object({
  id: z.string().min(1).max(32),
  label: textField({ max: LIMITS.optionLabel }),
});

const configSchema = z
  .object({
    options: z
      .array(optionSchema)
      .min(LIMITS.optionsMin)
      .max(LIMITS.optionsMax)
      .refine((options) => new Set(options.map((o) => o.id)).size === options.length, {
        message: 'Option ids must be unique',
      }),
    correctOptionId: z.string().min(1).max(32),
    seconds: z.number().int().min(LIMITS.quizSecondsMin).max(LIMITS.quizSecondsMax),
    /** What a right answer is worth; 0 makes it a practice question. Older quizzes have none. */
    points: z.number().int().min(0).max(LIMITS.quizPointsMax).default(LIMITS.quizPoints),
    /** Faster right answers earn more (down to half the points at the last second). */
    speedCounts: z.boolean().default(true),
  })
  .refine((config) => config.options.some((o) => o.id === config.correctOptionId), {
    message: 'The correct answer must be one of the options',
    path: ['correctOptionId'],
  });

export type QuizConfig = z.infer<typeof configSchema>;
/** What phones get while the question is open: no correct answer. */
export type QuizPublicConfig = Omit<QuizConfig, 'correctOptionId'> & { correctOptionId?: string };
export type QuizResponse = { optionId: string };
export type QuizResults = { counts: Record<string, number>; total: number };

export const QUIZ_SECONDS = [10, 20, 30, 60] as const;
export const QUIZ_POINTS = [0, 500, 1000, 2000] as const;

/**
 * Points for one answer: nothing for a wrong one. A right one gets `points`, or, when speed
 * counts, between half and all of them, falling linearly with the time it took.
 */
export function quizPoints(
  correct: boolean,
  elapsedMs: number,
  seconds: number,
  points: number = LIMITS.quizPoints,
  speedCounts = true,
): number {
  if (!correct) return 0;
  if (!speedCounts) return points;
  const share = Math.min(1, Math.max(0, elapsedMs / (seconds * 1000)));
  return Math.round(points * (1 - share / 2));
}

export const quiz = defineQuestionType<QuizConfig, QuizResponse, QuizResults>({
  type: 'quiz',
  configSchema,
  defaultConfig: () => {
    const options = [
      { id: randomId(8), label: '' },
      { id: randomId(8), label: '' },
    ];
    return {
      options,
      correctOptionId: options[0]?.id ?? '',
      seconds: 20,
      points: LIMITS.quizPoints,
      speedCounts: true,
    };
  },
  responseSchema: (config) =>
    z.object({
      optionId: z
        .string()
        .refine((id) => config.options.some((o) => o.id === id), { message: 'Unknown option' }),
    }),
  maxResponses: () => 1,
  aggregate: (config, responses) => {
    const counts: Record<string, number> = {};
    for (const option of config.options) counts[option.id] = 0;
    let total = 0;
    for (const { optionId } of responses) {
      if (Object.hasOwn(counts, optionId)) {
        counts[optionId] = (counts[optionId] ?? 0) + 1;
        total += 1;
      }
    }
    return { counts, total };
  },
  describeResponse: (config, { optionId }) =>
    config.options.find((option) => option.id === optionId)?.label ?? '',
  // The correct answer never reaches phones while the question is open.
  toPublicConfig: ({ correctOptionId: _hidden, ...rest }) => rest,
  timeLimit: (config) => config.seconds,
  score: (config, { optionId }, elapsedMs) =>
    quizPoints(
      optionId === config.correctOptionId,
      elapsedMs,
      config.seconds,
      config.points,
      config.speedCounts,
    ),
});
