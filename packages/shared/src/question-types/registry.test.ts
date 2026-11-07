import { describe, expect, expectTypeOf, test } from 'vitest';
import type { MultipleChoiceResponse } from './multiple-choice';
import {
  type ConfigOf,
  canModerate,
  getQuestionType,
  isQuestionTypeKey,
  moderationKeyOf,
  publicConfig,
  QUESTION_TYPE_KEYS,
  questionTypes,
  type ResponseOf,
  type ResultsOf,
} from './registry';
import type { ScaleConfig } from './scale';
import type { WordCloudResults } from './word-cloud';

describe('question type registry', () => {
  test('registers every type, released ones in their original order', () => {
    expect(QUESTION_TYPE_KEYS).toEqual([
      'multiple-choice',
      'word-cloud',
      'open-ended',
      'scale',
      'qa',
      'quiz',
    ]);
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
    expect(isQuestionTypeKey('ranking')).toBe(false);
    expect(isQuestionTypeKey('toString')).toBe(false);
  });

  test('only answers people type can be moderated', () => {
    expect(canModerate('word-cloud')).toBe(true);
    expect(canModerate('open-ended')).toBe(true);
    expect(canModerate('multiple-choice')).toBe(false);
    expect(canModerate('scale')).toBe(false);
    expect(canModerate('qa')).toBe(true);
    expect(moderationKeyOf('word-cloud', { text: 'Tea' })).toBe('tea');
    expect(moderationKeyOf('scale', { value: 3 })).toBeNull();
  });

  test('publicConfig hides the quiz answer until the question is closed', () => {
    const config = {
      options: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      correctOptionId: 'b',
      seconds: 20,
    };
    expect(publicConfig('quiz', config)).toEqual({ options: config.options, seconds: 20 });
    expect(publicConfig('quiz', config, true)).toEqual(config);
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
