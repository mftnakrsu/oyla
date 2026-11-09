import { describe, expect, test } from 'vitest';
import { qa } from './qa';

const config = qa.defaultConfig();

describe('qa', () => {
  test('accepts a question or an upvote, nothing else', () => {
    const schema = qa.responseSchema(config);
    expect(schema.parse({ text: '  Why now? ' })).toEqual({ text: 'Why now?' });
    expect(schema.parse({ upvote: 'why now?' })).toEqual({ upvote: 'why now?' });
    expect(schema.safeParse({ text: '' }).success).toBe(false);
    expect(schema.safeParse({ text: 'a', upvote: 'b' }).success).toBe(false);
    expect(schema.safeParse({ text: 'x'.repeat(201) }).success).toBe(false);
  });

  test('groups repeated questions and sorts by upvotes, ties oldest first', () => {
    const results = qa.aggregate(config, [
      { text: 'First?' },
      { text: 'Second?' },
      { upvote: 'second?' },
      { text: 'SECOND?' },
      { text: 'Third?' },
      { upvote: 'third?' },
      { upvote: 'nothing like this' },
    ]);
    expect(results).toEqual({
      entries: [
        { key: 'second?', text: 'Second?', votes: 1, answered: false },
        { key: 'third?', text: 'Third?', votes: 1, answered: false },
        { key: 'first?', text: 'First?', votes: 0, answered: false },
      ],
      total: 3,
    });
  });

  test('answered questions come after the open ones, each part by upvotes', () => {
    const results = qa.aggregate(
      config,
      [
        { text: 'Big?' },
        { upvote: 'big?' },
        { upvote: 'big?' },
        { text: 'Small?' },
        { text: 'Medium?' },
        { upvote: 'medium?' },
        { text: 'Old?' },
      ],
      { answeredKeys: new Set(['big?', 'old?']) },
    );
    expect(results.entries.map(({ key, answered }) => [key, answered])).toEqual([
      ['medium?', false],
      ['small?', false],
      ['big?', true],
      ['old?', true],
    ]);
  });

  test('only questions count as answers', () => {
    expect(qa.isAnswer?.({ text: 'Why?' })).toBe(true);
    expect(qa.isAnswer?.({ upvote: 'why?' })).toBe(false);
  });

  test('one upvote per question, and none for your own', () => {
    const allows = qa.allows ?? (() => true);
    expect(allows({ upvote: 'why?' }, [])).toBe(true);
    expect(allows({ upvote: 'why?' }, [{ upvote: 'why?' }])).toBe(false);
    expect(allows({ upvote: 'why?' }, [{ text: 'Why?' }])).toBe(false);
    expect(allows({ text: 'Why?' }, [{ text: 'Why?' }])).toBe(true);
  });

  test('a question and its upvotes share a moderation key', () => {
    expect(qa.moderationKey?.({ text: 'İzmir?' })).toBe(qa.moderationKey?.({ upvote: 'izmir?' }));
  });

  test('describes upvotes in the export', () => {
    expect(qa.describeResponse(config, { text: 'Why?' })).toBe('Why?');
    expect(qa.describeResponse(config, { upvote: 'why?' })).toBe('+1: why?');
  });
});
