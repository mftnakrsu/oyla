import { describe, expect, test } from 'vitest';
import { cleanText, textField } from './text';

describe('cleanText', () => {
  test('removes control and format characters but keeps emoji joiners', () => {
    expect(cleanText('a\u0000b‮c​d')).toBe('abcd');
    expect(cleanText('👩‍💻')).toBe('👩‍💻');
  });

  test('keeps line breaks only for multi-line text and normalises them', () => {
    expect(cleanText('one\r\ntwo', { multiline: true })).toBe('one\ntwo');
    expect(cleanText('one\ntwo')).toBe('onetwo');
    expect(cleanText('a\n\n\n\nb', { multiline: true })).toBe('a\n\nb');
  });

  test('turns tabs into spaces', () => {
    expect(cleanText('a\tb')).toBe('a b');
  });

  test('caps stacked combining marks', () => {
    const cleaned = cleanText(`a${String.fromCodePoint(0x301).repeat(24)}`);
    expect(cleaned).not.toMatch(/\p{M}{4,}/u);
    expect(cleaned.length).toBeLessThanOrEqual(4);
  });

  test('drops lone surrogates', () => {
    expect(cleanText('a\uD800b\uDC00c')).toBe('abc');
    expect(cleanText('😀')).toBe('😀');
  });

  test('normalises to NFC', () => {
    expect(cleanText('é')).toBe('é');
  });
});

describe('textField', () => {
  test('cleans, trims and checks length', () => {
    const schema = textField({ min: 1, max: 5 });
    expect(schema.parse('  ​ab  ')).toBe('ab');
    expect(schema.safeParse('​​').success).toBe(false);
    expect(schema.safeParse('abcdef').success).toBe(false);
  });
});
