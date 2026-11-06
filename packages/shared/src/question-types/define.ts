import type { z } from 'zod';

/**
 * Everything the server needs to know about a question type. The web app adds the matching
 * Editor, Respond and Results components in packages/web/src/question-types.
 */
export interface QuestionTypeDefinition<TConfig, TResponse, TResults> {
  /** Registry key, stored in the database. Never rename a released type. */
  type: string;
  /** The presenter's settings for one question. */
  configSchema: z.ZodType<TConfig>;
  /** Settings for a newly added question. Must pass configSchema. */
  defaultConfig(): TConfig;
  /** One participant answer, validated against the current config. */
  responseSchema(config: TConfig): z.ZodType<TResponse>;
  /** How many answers one participant may give to this question. */
  maxResponses(config: TConfig): number;
  /** Turns stored answers (oldest first) into what the presenter view shows. Must be pure. */
  aggregate(config: TConfig, responses: TResponse[]): TResults;
  /** One answer as a person reads it, e.g. the option label. Used for the CSV export. */
  describeResponse(config: TConfig, response: TResponse): string;
  /**
   * Answers with the same key are hidden together when the presenter moderates them. Types
   * without it (choices, numbers) can't be moderated.
   */
  moderationKey?(response: TResponse): string;
  /** What participants may see of the config. Defaults to all of it. */
  toPublicConfig?(config: TConfig): unknown;
}

export function defineQuestionType<TConfig, TResponse, TResults>(
  definition: QuestionTypeDefinition<TConfig, TResponse, TResults>,
): QuestionTypeDefinition<TConfig, TResponse, TResults> {
  return definition;
}
