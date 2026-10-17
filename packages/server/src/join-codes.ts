import { randomInt } from 'node:crypto';
import { JOIN_CODE_LENGTH } from '@oyla/shared';

const MAX_ATTEMPTS = 50;

/** A random code that `exists` reports as free, e.g. "042917". */
export function generateJoinCode(exists: (code: string) => boolean): string {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = String(randomInt(0, 10 ** JOIN_CODE_LENGTH)).padStart(JOIN_CODE_LENGTH, '0');
    if (!exists(code)) {
      return code;
    }
  }
  throw new Error('Could not find a free join code');
}
