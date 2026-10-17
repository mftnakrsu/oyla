import { QUESTION_TYPE_KEYS } from '@oyla/shared';
import { describe, expect, test } from 'vitest';
import { en } from '../i18n/en';
import { questionTypeUis } from './registry';

describe('web question type registry', () => {
  test('has a UI for exactly the types the shared registry knows', () => {
    expect(Object.keys(questionTypeUis).sort()).toEqual([...QUESTION_TYPE_KEYS].sort());
  });

  test('every type has a label and a description', () => {
    for (const ui of Object.values(questionTypeUis)) {
      expect(en[ui.labelKey]).toBeTruthy();
      expect(en[ui.descriptionKey]).toBeTruthy();
    }
  });
});
