import { describe, expect, expectTypeOf, test } from 'vitest';
import type { MultipleChoiceResponse } from './multiple-choice';
import {
  type ConfigOf,
  getQuestionType,
  isQuestionTypeKey,
  publicConfig,
  QUESTION_TYPE_KEYS,
  questionTypes,
  type ResponseOf,
  type ResultsOf,
} from './registry';
import type { ScaleConfig } from './scale';
import type { WordCloudResults } from './word-cloud';

describe('question type registry', () => {
  test('registers the four v0.1 types', () => {
    expect(QUESTION_TYPE_KEYS).toEqual(['multiple-choice', 'word-cloud', 'open-ended', 'scale']);
  });

  test('each definition is registered under its own key', () => {
    for (const key of QUESTION_TYPE_KEYS) {
      expect(questionTypes[key].type).toBe(key);
    }
  });

  test('every default config passes its own schema', () => {
    for (const key of QUESTION_TYPE_KEYS) {
      const type = getQuestionType(key);
      expect(type.configSchema.safeParse(type.defaultConfig()).success).toBe(true);
    }
  });

  test('isQuestionTypeKey narrows strings', () => {
    expect(isQuestionTypeKey('scale')).toBe(true);
    expect(isQuestionTypeKey('quiz')).toBe(false);
    expect(isQuestionTypeKey('toString')).toBe(false);
  });

  test('publicConfig returns the config when a type does not hide anything', () => {
    const config = { maxEntries: 2 };
    expect(publicConfig('word-cloud', config)).toEqual(config);
  });
});

describe('registry types', () => {
  test('ConfigOf, ResponseOf and ResultsOf resolve to the definition types', () => {
    expectTypeOf<ConfigOf<'scale'>>().toEqualTypeOf<ScaleConfig>();
    expectTypeOf<ResponseOf<'multiple-choice'>>().toEqualTypeOf<MultipleChoiceResponse>();
    expectTypeOf<ResultsOf<'word-cloud'>>().toEqualTypeOf<WordCloudResults>();
  });
});
