import type { QuestionTypeDefinition } from './define';
import { multipleChoice } from './multiple-choice';
import { openEnded } from './open-ended';
import { qa } from './qa';
import { quiz } from './quiz';
import { scale } from './scale';
import { wordCloud } from './word-cloud';

/**
 * Every question type Oyla knows. To add one, create a definition next to this file, register it
 * here and add its components to packages/web/src/question-types/registry.ts.
 */
export const questionTypes = {
  'multiple-choice': multipleChoice,
  'word-cloud': wordCloud,
  'open-ended': openEnded,
  scale,
  qa,
  quiz,
} as const;

export type QuestionTypeKey = keyof typeof questionTypes;

export const QUESTION_TYPE_KEYS = Object.keys(questionTypes) as QuestionTypeKey[];

type PartsOf<K extends QuestionTypeKey> =
  (typeof questionTypes)[K] extends QuestionTypeDefinition<infer C, infer R, infer Res>
    ? { config: C; response: R; results: Res }
    : never;
export type ConfigOf<K extends QuestionTypeKey> = PartsOf<K>['config'];
export type ResponseOf<K extends QuestionTypeKey> = PartsOf<K>['response'];
export type ResultsOf<K extends QuestionTypeKey> = PartsOf<K>['results'];

export function isQuestionTypeKey(value: string): value is QuestionTypeKey {
  return Object.hasOwn(questionTypes, value);
}

/** The registry entry with its generics erased, for code that handles every type alike. */
export function getQuestionType(
  key: QuestionTypeKey,
): QuestionTypeDefinition<unknown, unknown, unknown> {
  return questionTypes[key] as unknown as QuestionTypeDefinition<unknown, unknown, unknown>;
}

/** Whether the presenter can hide answers of this type from the screen. */
export function canModerate(key: QuestionTypeKey): boolean {
  return getQuestionType(key).moderationKey !== undefined;
}

/** Whether the presenter can mark answers of this type as answered (see `canMarkAnswered`). */
export function canMarkAnswered(key: QuestionTypeKey): boolean {
  return getQuestionType(key).canMarkAnswered === true;
}

/** The answer's moderation key, or null when the type can't be moderated. */
export function moderationKeyOf(key: QuestionTypeKey, response: unknown): string | null {
  const type = getQuestionType(key);
  return type.moderationKey ? type.moderationKey(response) : null;
}

/** Whether every phone sees the live results while answering (see `sharedOnPhones`). */
export function isSharedOnPhones(key: QuestionTypeKey): boolean {
  return getQuestionType(key).sharedOnPhones === true;
}

/**
 * What participants may see of the config. Once a timed question is closed they get all of it,
 * so the correct answer can be shown.
 */
export function publicConfig(key: QuestionTypeKey, config: unknown, closed = false): unknown {
  const type = getQuestionType(key);
  return type.toPublicConfig && !closed ? type.toPublicConfig(config) : config;
}

/** Whether answers to this type close after a time limit (see `timeLimit`). */
export function isTimed(key: QuestionTypeKey): boolean {
  return getQuestionType(key).timeLimit !== undefined;
}

/** Whether answers to this type earn points for the leaderboard (see `score`). */
export function isScored(key: QuestionTypeKey): boolean {
  return getQuestionType(key).score !== undefined;
}
