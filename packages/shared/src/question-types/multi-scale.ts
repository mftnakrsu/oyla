import { z } from 'zod';
import { randomId } from '../ids';
import { LIMITS } from '../limits';
import { textField } from '../text';
import { defineQuestionType } from './define';

const statementSchema = z.object({
  id: z.string().min(1).max(32),
  label: textField({ max: LIMITS.optionLabel }),
});

const configSchema = z.object({
  min: z.union([z.literal(0), z.literal(1)]),
  max: z.number().int().min(2).max(10),
  minLabel: textField({ max: LIMITS.scaleLabel }),
  maxLabel: textField({ max: LIMITS.scaleLabel }),
  statements: z
    .array(statementSchema)
    .min(LIMITS.statementsMin)
    .max(LIMITS.statementsMax)
    .refine((statements) => new Set(statements.map((s) => s.id)).size === statements.length, {
      message: 'Statement ids must be unique',
    }),
});

export type MultiScaleConfig = z.infer<typeof configSchema>;
/** One rating per statement id. */
export type MultiScaleResponse = { ratings: Record<string, number> };
export interface MultiScaleStatementResult {
  id: string;
  /** Null until someone rated this statement. */
  average: number | null;
  count: number;
}
/** One entry per statement of the current config, in its order. */
export type MultiScaleResults = { statements: MultiScaleStatementResult[]; total: number };

export const multiScale = defineQuestionType<
  MultiScaleConfig,
  MultiScaleResponse,
  MultiScaleResults
>({
  type: 'multi-scale',
  configSchema,
  defaultConfig: () => ({
    min: 1,
    max: 5,
    minLabel: '',
    maxLabel: '',
    statements: [
      { id: randomId(8), label: '' },
      { id: randomId(8), label: '' },
    ],
  }),
  // Every statement exactly once, nothing else.
  responseSchema: (config) =>
    z.strictObject({
      ratings: z
        .record(z.string(), z.number().int().min(config.min).max(config.max))
        .refine(
          (ratings) =>
            Object.keys(ratings).length === config.statements.length &&
            config.statements.every((statement) => Object.hasOwn(ratings, statement.id)),
          { message: 'Rate every statement once' },
        ),
    }),
  maxResponses: () => 1,
  aggregate: (config, responses) => {
    const sums = new Map(
      config.statements.map((statement) => [statement.id, { sum: 0, count: 0 }]),
    );
    for (const { ratings } of responses) {
      for (const [id, value] of Object.entries(ratings ?? {})) {
        // Statements removed after people answered, and odd values, are skipped.
        const entry = sums.get(id);
        if (!entry || !Number.isInteger(value) || value < config.min || value > config.max) {
          continue;
        }
        entry.sum += value;
        entry.count += 1;
      }
    }
    return {
      statements: config.statements.map(({ id }) => {
        const { sum, count } = sums.get(id) ?? { sum: 0, count: 0 };
        return { id, average: count === 0 ? null : sum / count, count };
      }),
      total: responses.length,
    };
  },
  describeResponse: (config, { ratings }) =>
    config.statements
      .flatMap((statement, index) => {
        const value = ratings[statement.id];
        return value === undefined ? [] : [`${statement.label || `#${index + 1}`}: ${value}`];
      })
      .join('; '),
});
