import { z } from 'zod';
import { LIMITS } from '../limits';
import { defineQuestionType } from './define';

const configSchema = z.object({
  min: z.union([z.literal(0), z.literal(1)]),
  max: z.number().int().min(2).max(10),
  minLabel: z.string().trim().max(LIMITS.scaleLabel),
  maxLabel: z.string().trim().max(LIMITS.scaleLabel),
});

export type ScaleConfig = z.infer<typeof configSchema>;
export type ScaleResponse = { value: number };
export type ScaleResults = { distribution: number[]; average: number | null; total: number };

export const scale = defineQuestionType<ScaleConfig, ScaleResponse, ScaleResults>({
  type: 'scale',
  configSchema,
  defaultConfig: () => ({ min: 1, max: 5, minLabel: '', maxLabel: '' }),
  responseSchema: (config) => z.object({ value: z.number().int().min(config.min).max(config.max) }),
  maxResponses: () => 1,
  aggregate: (config, responses) => {
    const distribution = Array.from({ length: config.max - config.min + 1 }, () => 0);
    let total = 0;
    let sum = 0;
    for (const { value } of responses) {
      const slot = value - config.min;
      const current = distribution[slot];
      if (Number.isInteger(value) && current !== undefined) {
        distribution[slot] = current + 1;
        total += 1;
        sum += value;
      }
    }
    return { distribution, average: total === 0 ? null : sum / total, total };
  },
});
