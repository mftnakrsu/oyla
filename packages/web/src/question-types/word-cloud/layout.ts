export type Tier = 1 | 2 | 3;
export type Orientation = 0 | 90 | -90;

/** Colour tier from how common a word is relative to the most common one. */
export function tierOf(count: number, max: number): Tier {
  const share = count / max;
  return share >= 0.66 ? 1 : share >= 0.33 ? 2 : 3;
}

/**
 * Font size between `smallest` and `largest`, linear in the count so a word twice as common is
 * clearly bigger. When every count is equal all words are mid-sized.
 */
export function sizeOf(count: number, max: number, smallest: number, largest: number): number {
  const t = max <= 1 ? 0.5 : (count - 1) / (max - 1);
  return smallest + t * (largest - smallest);
}

/** FNV-1a: a small, stable hash so a word gets the same orientation on every render. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * About four in ten words read vertically, turned either way. The orientation comes from the
 * word itself, so the cloud does not reshuffle when new answers arrive; the most common word
 * always stays horizontal.
 */
export function orientationOf(text: string, rank: number): Orientation {
  if (rank === 0) return 0;
  const bucket = hash(text) % 10;
  return bucket < 6 ? 0 : bucket < 8 ? 90 : -90;
}
