import { z } from 'zod';
import { LIMITS } from '../limits';
import { cleanText } from '../text';
import { defineQuestionType } from './define';

const configSchema = z.object({
  maxEntries: z.number().int().min(1).max(LIMITS.maxEntries),
});

const entrySchema = z.object({
  text: z
    .string()
    .transform((text) => cleanText(text).trim().replace(/\s+/g, ' '))
    .pipe(z.string().min(1).max(LIMITS.wordCloudEntry)),
});

/**
 * Case-insensitive grouping that also works for Turkish: "İzmir", "izmir" and "IZMIR" match
 * (lower-casing İ leaves a combining dot, and ı is folded into i).
 */
export function groupKey(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\u0307/g, '')
    .replace(/ı/g, 'i');
}

export type WordCloudConfig = z.infer<typeof configSchema>;
export type WordCloudResponse = { text: string };
export type WordCloudResults = { words: { text: string; count: number }[]; total: number };

export const wordCloud = defineQuestionType<WordCloudConfig, WordCloudResponse, WordCloudResults>({
  type: 'word-cloud',
  configSchema,
  defaultConfig: () => ({ maxEntries: 3 }),
  responseSchema: () => entrySchema,
  maxResponses: (config) => config.maxEntries,
  aggregate: (_config, responses) => {
    // Map keeps insertion order, which gives ties a stable first-appearance order.
    const groups = new Map<string, { text: string; count: number }>();
    for (const { text } of responses) {
      const key = groupKey(text);
      const group = groups.get(key);
      if (group) {
        group.count += 1;
      } else {
        groups.set(key, { text, count: 1 });
      }
    }
    const words = [...groups.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, LIMITS.wordCloudTop);
    return { words, total: responses.length };
  },
});
