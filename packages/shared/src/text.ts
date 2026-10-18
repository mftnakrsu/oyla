import { z } from 'zod';

// Control and format characters: NUL, bidi overrides, zero-width spaces… Newlines and the
// zero-width joiner (used inside emoji sequences) are handled separately below.
const INVISIBLE = /[\p{Cc}\p{Cf}]/gu;
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
const STACKED_MARKS = /(\p{M}{3})\p{M}+/gu;

/**
 * Makes user text safe to put on a projector: no invisible or direction-flipping characters,
 * no lone surrogates, at most three stacked accents. Does not trim.
 */
export function cleanText(
  value: string,
  { multiline = false }: { multiline?: boolean } = {},
): string {
  let text = value.replace(LONE_SURROGATE, '').normalize('NFC').replace(/\r\n?/g, '\n');
  text = text.replace(INVISIBLE, (char) => {
    if (char === '‍') return char;
    if (char === '\n') return multiline ? char : '';
    if (char === '\t') return ' ';
    return '';
  });
  text = text.replace(STACKED_MARKS, '$1');
  return multiline ? text.replace(/\n{3,}/g, '\n\n') : text;
}

/** A user-written string field: cleaned, trimmed, then length-checked. */
export function textField({
  min = 0,
  max,
  multiline = false,
}: {
  min?: number;
  max: number;
  multiline?: boolean;
}) {
  return z
    .string()
    .transform((value) => cleanText(value, { multiline }).trim())
    .pipe(z.string().min(min).max(max));
}
