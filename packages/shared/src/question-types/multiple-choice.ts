import { z } from 'zod';
import { randomId } from '../ids';
import { LIMITS } from '../limits';
import { textField } from '../text';
import { defineQuestionType } from './define';

const optionSchema = z.object({
  id: z.string().min(1).max(32),
  label: textField({ max: LIMITS.optionLabel }),
});

const configSchema = z.object({
  options: z
    .array(optionSchema)
    .min(LIMITS.optionsMin)
    .max(LIMITS.optionsMax)
    .refine((options) => new Set(options.map((o) => o.id)).size === options.length, {
      message: 'Option ids must be unique',
    }),
});

export type MultipleChoiceConfig = z.infer<typeof configSchema>;
export type MultipleChoiceResponse = { optionId: string };
export type MultipleChoiceResults = { counts: Record<string, number>; total: number };

export const multipleChoice = defineQuestionType<
  MultipleChoiceConfig,
  MultipleChoiceResponse,
  MultipleChoiceResults
>({
  type: 'multiple-choice',
  configSchema,
  defaultConfig: () => ({
    options: [
      { id: randomId(8), label: '' },
      { id: randomId(8), label: '' },
    ],
  }),
  responseSchema: (config) =>
    z.object({
      optionId: z
        .string()
        .refine((id) => config.options.some((o) => o.id === id), { message: 'Unknown option' }),
    }),
  maxResponses: () => 1,
  aggregate: (config, responses) => {
    const counts: Record<string, number> = {};
    for (const option of config.options) {
      counts[option.id] = 0;
    }
    let total = 0;
    for (const { optionId } of responses) {
      // hasOwn, so an id like "toString" from a removed option can't hit Object.prototype.
      if (Object.hasOwn(counts, optionId)) {
        counts[optionId] = (counts[optionId] ?? 0) + 1;
        total += 1;
      }
    }
    return { counts, total };
  },
});
