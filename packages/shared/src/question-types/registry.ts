import type { QuestionTypeDefinition } from './define';
import { multipleChoice } from './multiple-choice';
import { openEnded } from './open-ended';
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

export function publicConfig(key: QuestionTypeKey, config: unknown): unknown {
  const type = getQuestionType(key);
  return type.toPublicConfig ? type.toPublicConfig(config) : config;
}
