import { describe, expect, test } from 'vitest';
import { de } from './de';
import { en } from './en';
import { createTranslator, detectLanguage, interpolate } from './I18nProvider';
import { tr } from './tr';

const dictionaries = { tr, de };

describe('dictionaries', () => {
  test('translations have every English key and no empty strings', () => {
    for (const [code, dictionary] of Object.entries(dictionaries)) {
      expect(Object.keys(dictionary).sort(), code).toEqual(Object.keys(en).sort());
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value.trim(), `${code}.${key}`).not.toBe('');
      }
    }
  });

  test('placeholders match between languages', () => {
    const names = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const [code, dictionary] of Object.entries(dictionaries)) {
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        expect(names(dictionary[key]), `${code}.${key}`).toEqual(names(en[key]));
      }
    }
  });

  test('every plural has both forms', () => {
    for (const key of Object.keys(en)) {
      if (key.endsWith('.one'))
        expect(Object.hasOwn(en, key.replace(/\.one$/, '.other'))).toBe(true);
    }
  });
});

describe('translator', () => {
  test('interpolates variables and leaves unknown ones', () => {
    expect(interpolate('Hello {name}, {missing}', { name: 'Ada' })).toBe('Hello Ada, {missing}');
  });

  test('picks plural forms', () => {
    const { tn } = createTranslator('en');
    expect(tn('results.votes', 1)).toBe('1 vote');
    expect(tn('results.votes', 3)).toBe('3 votes');
  });

  test('tRich keeps word order per language', () => {
    const host = 'HOST';
    const code = 'CODE';
    expect(createTranslator('en').tRich('present.join', { host, code })).toEqual([
      'Go to ',
      host,
      ' and enter ',
      code,
      '',
    ]);
    expect(createTranslator('tr').tRich('present.join', { host, code })[1]).toBe(host);
  });
});

describe('detectLanguage', () => {
  test('prefers a stored choice', () => {
    localStorage.setItem('oyla:language', JSON.stringify('tr'));
    expect(detectLanguage()).toBe('tr');
    localStorage.setItem('oyla:language', JSON.stringify('de'));
    expect(detectLanguage()).toBe('de');
  });
});
