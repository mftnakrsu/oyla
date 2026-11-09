import {
  getQuestionType,
  isQuestionTypeKey,
  type PresentationDto,
  type ResponseExportDto,
} from '@oyla/shared';
import type { MessageKey } from '../i18n/en';

type Translate = (key: MessageKey) => string;

/** Byte order mark: without it, Excel reads UTF-8 files (and so Turkish letters) as Latin-1. */
const BOM = String.fromCharCode(0xfeff);

/** Characters a spreadsheet treats as the start of a formula. */
const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * Answers come from anyone with the join code, so a cell like `=HYPERLINK(…)` must not run as a
 * formula when the presenter opens the file. A leading apostrophe makes it plain text.
 */
export function safeCell(value: string): string {
  return FORMULA_START.test(value) ? `'${value}` : value;
}

function quote(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** RFC 4180 CSV with CRLF line ends and a BOM. */
export function toCsv(rows: string[][]): string {
  const lines = rows.map((row) => row.map((cell) => quote(safeCell(cell))).join(','));
  return `${BOM}${lines.join('\r\n')}\r\n`;
}

function describe(type: string, config: unknown, payload: unknown): string {
  if (!isQuestionTypeKey(type)) return '';
  const definition = getQuestionType(type);
  const parsed = definition.configSchema.safeParse(config);
  if (!parsed.success) return '';
  try {
    return definition.describeResponse(parsed.data, payload);
  } catch {
    return '';
  }
}

/** One row per answer, grouped by question in presentation order, oldest answer first. */
export function resultsCsv(
  presentation: PresentationDto,
  responses: ResponseExportDto[],
  t: Translate,
): string {
  const questions = new Map(
    presentation.questions.map((question, index) => [question.id, { question, index }]),
  );
  const rows = responses
    .flatMap((response) => {
      const entry = questions.get(response.questionId);
      return entry ? [{ response, ...entry }] : [];
    })
    // Array.prototype.sort is stable, so answers keep their order within a question.
    .sort((a, b) => a.index - b.index)
    .map(({ response, question, index }) => [
      String(index + 1),
      question.title || t('editor.question.untitled'),
      t(`type.${question.type}.label` as MessageKey),
      describe(question.type, question.config, response.payload),
      response.score === null ? '' : String(response.score),
      String(response.participant),
      response.name ?? '',
      new Date(response.createdAt).toISOString(),
      response.hidden ? t('csv.yes') : '',
    ]);
  return toCsv([
    [
      t('csv.number'),
      t('csv.question'),
      t('csv.type'),
      t('csv.answer'),
      t('csv.points'),
      t('csv.participant'),
      t('csv.name'),
      t('csv.time'),
      t('csv.hidden'),
    ],
    ...rows,
  ]);
}

/** `oyla-<title>-<date>.csv` with the title folded to ASCII, e.g. "İş Toplantısı" → "is-toplantisi". */
export function csvFileName(title: string, date: Date): string {
  const slug = title
    .replace(/[ıİ]/g, 'i')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `oyla-${slug || 'results'}-${day}.csv`;
}

/** Hands the text to the browser as a file download. */
export function downloadCsv(fileName: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoke after the click has been handled, or some browsers cancel the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
