import type { PresentationDto, ResponseExportDto } from '@oyla/shared';
import { describe, expect, test } from 'vitest';
import { createTranslator } from '../i18n/I18nProvider';
import { csvFileName, resultsCsv, safeCell, toCsv } from './csv';

const presentation: PresentationDto = {
  id: 'p1',
  title: 'Retro',
  theme: 'emerald',
  resultsOnPhones: false,
  joinCode: '123456',
  activeQuestionId: null,
  createdAt: 0,
  updatedAt: 0,
  questions: [
    {
      id: 'mc',
      type: 'multiple-choice',
      title: 'Tea or coffee?',
      config: {
        options: [
          { id: 'a', label: 'Tea' },
          { id: 'b', label: 'Coffee, black' },
        ],
      },
      position: 0,
      responseCount: 2,
      resultsHidden: false,
    },
    {
      id: 'notes',
      type: 'open-ended',
      title: '',
      config: { maxEntries: 1 },
      position: 1,
      responseCount: 1,
      resultsHidden: false,
    },
  ],
};

const at = Date.UTC(2026, 10, 6, 9, 30, 0);
const responses: ResponseExportDto[] = [
  {
    questionId: 'notes',
    participant: 1,
    payload: { text: '=HYPERLINK("x")' },
    createdAt: at,
    hidden: true,
  },
  {
    questionId: 'mc',
    participant: 1,
    payload: { optionId: 'b' },
    createdAt: at + 1000,
    hidden: false,
  },
  {
    questionId: 'mc',
    participant: 2,
    payload: { optionId: 'gone' },
    createdAt: at + 2000,
    hidden: false,
  },
];

describe('safeCell', () => {
  test('defuses cells a spreadsheet would run as a formula', () => {
    for (const value of ['=1+1', '+1', '-1', '@SUM(A1)', '\tx', '\rx']) {
      expect(safeCell(value)).toBe(`'${value}`);
    }
    expect(safeCell('Coffee')).toBe('Coffee');
    expect(safeCell('')).toBe('');
  });
});

describe('toCsv', () => {
  test('starts with a BOM, uses CRLF and quotes only when needed', () => {
    expect(
      toCsv([
        ['a', 'b,c'],
        ['say "hi"', 'two\nlines'],
      ]),
    ).toBe('\uFEFFa,"b,c"\r\n"say ""hi""","two\nlines"\r\n');
  });
});

describe('resultsCsv', () => {
  test('one row per answer, grouped by question, with readable answers', () => {
    const csv = resultsCsv(presentation, responses, createTranslator('en').t);
    expect(csv.split('\r\n')).toEqual([
      '\uFEFF#,Question,Question type,Answer,Participant,Time (UTC),Hidden',
      '1,Tea or coffee?,Multiple choice,"Coffee, black",1,2026-11-06T09:30:01.000Z,',
      '1,Tea or coffee?,Multiple choice,,2,2026-11-06T09:30:02.000Z,',
      `2,Untitled question,Open question,"'=HYPERLINK(""x"")",1,2026-11-06T09:30:00.000Z,yes`,
      '',
    ]);
  });

  test('headers follow the interface language', () => {
    const csv = resultsCsv(presentation, [], createTranslator('tr').t);
    expect(csv).toBe('\uFEFF#,Soru,Soru tipi,Cevap,Katılımcı,Zaman (UTC),Gizlendi\r\n');
  });
});

describe('csvFileName', () => {
  const date = new Date(2026, 10, 6);
  test('slugs the title and adds the date', () => {
    expect(csvFileName('Haftalık İş Toplantısı', date)).toBe(
      'oyla-haftalik-is-toplantisi-2026-11-06.csv',
    );
    expect(csvFileName('  ???  ', date)).toBe('oyla-results-2026-11-06.csv');
  });
});
