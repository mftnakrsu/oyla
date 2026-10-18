import { Easing, interpolate, random } from "remotion";
import { clamp } from "../../theme";

export type Arrival = { readonly item: number; readonly at: number };

/**
 * When each answer reaches the presenter: a few at first, then a rush, then the last ones
 * (arrival times follow an S-curve). The order is shuffled but fixed by `seed`. `own` pins the
 * phone's answer to the moment it is sent.
 */
export const arrivals = (
  counts: readonly number[],
  start: number,
  end: number,
  seed: string,
  own?: Arrival,
): Arrival[] => {
  const shuffled = counts
    .flatMap((count, item) => Array.from({ length: count }, (_, n) => ({ item, key: random(`${seed}-${item}-${n}`) })))
    .sort((a, b) => a.key - b.key);
  if (own) {
    const index = shuffled.findIndex((entry) => entry.item === own.item);
    if (index >= 0) shuffled.splice(index, 1);
  }
  const spread = shuffled.map((entry, index) => ({
    item: entry.item,
    at: start + (end - start) * (Math.acos(1 - (2 * (index + 0.5)) / shuffled.length) / Math.PI),
  }));
  return own ? [...spread, own].sort((a, b) => a.at - b.at) : spread;
};

/** How many answers for `item` have arrived by `frame`. */
export const arrived = (list: readonly Arrival[], item: number, frame: number) =>
  list.filter((entry) => entry.item === item && entry.at <= frame).length;

/** Like arrived(), but each answer eases in over 8 frames, like the app's CSS transition. */
export const grown = (list: readonly Arrival[], item: number, frame: number) =>
  list
    .filter((entry) => entry.item === item)
    .reduce((sum, entry) => sum + interpolate(frame, [entry.at, entry.at + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }), 0);

/**
 * Answers arriving in a fixed order, the phone's one (`own`) pinned in place: the ones before it
 * spread evenly from `start` to just before it, the ones after it follow every `gap` frames.
 */
export const inOrder = (order: readonly number[], start: number, own: Arrival, gap = 16): Arrival[] => {
  const position = order.indexOf(own.item);
  const before = order.slice(0, Math.max(0, position));
  const after = order.slice(position + 1);
  const last = own.at - 10;
  return [
    ...before.map((item, i) => ({ item, at: before.length === 1 ? start : start + ((last - start) * i) / (before.length - 1) })),
    own,
    ...after.map((item, i) => ({ item, at: own.at + 14 + gap * i })),
  ];
};
