import { describe, expect, test } from 'vitest';
import { createPresentationBody, createQuestionBody, reorderQuestionsBody } from './api';
import {
  participantJoinSchema,
  presenterActivateSchema,
  presenterJoinSchema,
  responseSubmitSchema,
} from './protocol';

const participantId = 'abcdefghijklmnop';

describe('socket payload schemas', () => {
  test('participant join needs a 6-digit code and a well-formed id', () => {
    expect(participantJoinSchema.safeParse({ joinCode: '123456', participantId }).success).toBe(
      true,
    );
    expect(participantJoinSchema.safeParse({ joinCode: '12345', participantId }).success).toBe(
      false,
    );
    expect(participantJoinSchema.safeParse({ joinCode: '12345a', participantId }).success).toBe(
      false,
    );
    expect(
      participantJoinSchema.safeParse({ joinCode: '123456', participantId: 'short' }).success,
    ).toBe(false);
    expect(
      participantJoinSchema.safeParse({ joinCode: '123456', participantId: 'has spaces in it!!' })
        .success,
    ).toBe(false);
  });

  test('response submit needs a question id', () => {
    expect(
      responseSubmitSchema.safeParse({ questionId: 'q1', response: { optionId: 'a' } }).success,
    ).toBe(true);
    expect(responseSubmitSchema.safeParse({ questionId: '', response: {} }).success).toBe(false);
    expect(
      responseSubmitSchema.safeParse({ questionId: 'x'.repeat(33), response: {} }).success,
    ).toBe(false);
  });

  test('presenter join and activate', () => {
    expect(presenterJoinSchema.safeParse({ presentationId: 'p1', adminToken: 't' }).success).toBe(
      true,
    );
    expect(
      presenterJoinSchema.safeParse({ presentationId: 'p1', adminToken: 'x'.repeat(101) }).success,
    ).toBe(false);
    expect(presenterActivateSchema.safeParse({ questionId: null }).success).toBe(true);
    expect(presenterActivateSchema.safeParse({}).success).toBe(false);
  });
});

describe('REST body schemas', () => {
  test('presentation title is trimmed and required', () => {
    expect(createPresentationBody.parse({ title: '  Team retro ' })).toEqual({
      title: 'Team retro',
    });
    expect(createPresentationBody.safeParse({ title: '   ' }).success).toBe(false);
    expect(createPresentationBody.safeParse({ title: 'x'.repeat(121) }).success).toBe(false);
  });

  test('question type must be registered', () => {
    expect(createQuestionBody.safeParse({ type: 'scale' }).success).toBe(true);
    expect(createQuestionBody.safeParse({ type: 'quiz' }).success).toBe(false);
  });

  test('reorder accepts at most 50 ids', () => {
    const ids = Array.from({ length: 51 }, (_, i) => `q${i}`);
    expect(reorderQuestionsBody.safeParse({ ids }).success).toBe(false);
  });
});
