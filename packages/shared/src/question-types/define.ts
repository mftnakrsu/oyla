import type { z } from 'zod';

/** What `aggregate` knows beyond the answers themselves. */
export interface AggregateContext {
  /** Moderation keys the presenter marked as answered (`canMarkAnswered` types only). */
  answeredKeys: ReadonlySet<string>;
}

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
  /**
   * Turns stored answers (oldest first) into what the presenter view shows. Must be pure. Types
   * with `canMarkAnswered` also get the moderation keys the presenter marked as answered.
   */
  aggregate(config: TConfig, responses: TResponse[], context?: AggregateContext): TResults;
  /** One answer as a person reads it, e.g. the option label. Used for the CSV export. */
  describeResponse(config: TConfig, response: TResponse): string;
  /**
   * Answers with the same key are hidden together when the presenter moderates them. Types
   * without it (choices, numbers) can't be moderated.
   */
  moderationKey?(response: TResponse): string;
  /** What participants may see of the config. Defaults to all of it. */
  toPublicConfig?(config: TConfig): unknown;
  /**
   * Whether a response is an answer of its own. Responses that aren't (an upvote of someone
   * else's question) don't count toward `maxResponses` or the answer totals. Defaults to true.
   */
  isAnswer?(response: TResponse): boolean;
  /**
   * Extra rule for one participant, given their earlier responses to the question (oldest
   * first), e.g. "upvote a question once". Defaults to allowing everything.
   */
  allows?(response: TResponse, own: TResponse[]): boolean;
  /**
   * People answer by reacting to everyone else's answers (Q&A upvotes): every phone gets the
   * live results and its own earlier responses, whatever the presentation's phone setting, and
   * keeps the answer form open instead of a "thanks" screen.
   */
  sharedOnPhones?: boolean;
  /**
   * The presenter can mark an answer (by its `moderationKey`) as answered, like a Q&A question
   * they have talked about. Responses that aren't answers (upvotes) are refused for it from then
   * on. Needs `moderationKey`.
   */
  canMarkAnswered?: boolean;
  /**
   * Seconds people have to answer, counted on the server from when the presenter opened the
   * question. Later answers are refused. Once the time is up, phones get the whole config
   * (`toPublicConfig` no longer applies), so the correct answer can be revealed.
   */
  timeLimit?(config: TConfig): number;
  /**
   * Points for an answer, given how long after opening it arrived (measured on the server).
   * Scored types add up into a leaderboard across the presentation.
   */
  score?(config: TConfig, response: TResponse, elapsedMs: number): number;
}

export function defineQuestionType<TConfig, TResponse, TResults>(
  definition: QuestionTypeDefinition<TConfig, TResponse, TResults>,
): QuestionTypeDefinition<TConfig, TResponse, TResults> {
  return definition;
}
