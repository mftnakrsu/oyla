import { z } from 'zod';
import { LIMITS } from '../limits';
import { groupKey, textField } from '../text';
import { defineQuestionType } from './define';

const configSchema = z.object({
  /** Questions one person may ask; upvotes are unlimited (one per question). */
  maxEntries: z.number().int().min(1).max(LIMITS.maxEntries),
});

const askSchema = z.strictObject({
  text: textField({ min: 1, max: LIMITS.qaQuestion }),
});
const upvoteSchema = z.strictObject({
  /** The moderation key (`groupKey`) of the question being upvoted. */
  upvote: z.string().min(1).max(LIMITS.hiddenKey),
});

export type QaConfig = z.infer<typeof configSchema>;
export type QaAsk = { text: string };
export type QaUpvote = { upvote: string };
export type QaResponse = QaAsk | QaUpvote;
export interface QaEntry {
  /** `groupKey` of the text: what upvotes and moderation refer to. */
  key: string;
  text: string;
  votes: number;
}
/** Most upvoted first; ties keep the order the questions were asked in. */
export type QaResults = { entries: QaEntry[]; total: number };

export function isQaAsk(response: QaResponse): response is QaAsk {
  return 'text' in response;
}

/** The key a response refers to: an ask's own text, or the question an upvote is for. */
function keyOf(response: QaResponse): string {
  return isQaAsk(response) ? groupKey(response.text) : response.upvote;
}

export const qa = defineQuestionType<QaConfig, QaResponse, QaResults>({
  type: 'qa',
  configSchema,
  defaultConfig: () => ({ maxEntries: 3 }),
  responseSchema: () => z.union([askSchema, upvoteSchema]),
  maxResponses: (config) => config.maxEntries,
  aggregate: (_config, responses) => {
    const byKey = new Map<string, QaEntry>();
    // Questions first, so an upvote that arrived before a re-asked duplicate still counts.
    for (const response of responses) {
      if (!isQaAsk(response)) continue;
      const key = groupKey(response.text);
      if (!byKey.has(key)) byKey.set(key, { key, text: response.text, votes: 0 });
    }
    for (const response of responses) {
      if (isQaAsk(response)) continue;
      const entry = byKey.get(response.upvote);
      if (entry) entry.votes += 1;
    }
    // Map keeps insertion order and sort is stable, so ties stay oldest first.
    const entries = [...byKey.values()].sort((a, b) => b.votes - a.votes).slice(0, LIMITS.qaTop);
    return { entries, total: byKey.size };
  },
  describeResponse: (_config, response) =>
    isQaAsk(response) ? response.text : `+1: ${response.upvote}`,
  // Hiding a question hides its upvotes too, and asking it again doesn't bring it back.
  moderationKey: keyOf,
  isAnswer: isQaAsk,
  allows: (response, own) => {
    if (isQaAsk(response)) return true;
    // One upvote per question, and not for a question you asked yourself.
    return !own.some((earlier) => keyOf(earlier) === response.upvote);
  },
  sharedOnPhones: true,
});
