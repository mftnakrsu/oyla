import { z } from 'zod';
import { LIMITS } from '../limits';
import { defineQuestionType } from './define';

const configSchema = z.object({
  maxEntries: z.number().int().min(1).max(LIMITS.maxEntries),
});

const entrySchema = z.object({
  text: z.string().trim().min(1).max(LIMITS.openEndedEntry),
});

export type OpenEndedConfig = z.infer<typeof configSchema>;
export type OpenEndedResponse = { text: string };
export type OpenEndedResults = { entries: { key: number; text: string }[]; total: number };

export const openEnded = defineQuestionType<OpenEndedConfig, OpenEndedResponse, OpenEndedResults>({
  type: 'open-ended',
  configSchema,
  defaultConfig: () => ({ maxEntries: 1 }),
  responseSchema: () => entrySchema,
  maxResponses: (config) => config.maxEntries,
  aggregate: (_config, responses) => {
    const entries: OpenEndedResults['entries'] = [];
    const oldest = Math.max(0, responses.length - LIMITS.openEndedLatest);
    for (let index = responses.length - 1; index >= oldest; index -= 1) {
      const response = responses[index];
      if (response) {
        entries.push({ key: index, text: response.text });
      }
    }
    return { entries, total: responses.length };
  },
});
