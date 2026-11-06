/** A copy of `list` with the item at `from` moved so it ends up at index `to`. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const result = [...list];
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return result;
  const [item] = result.splice(from, 1);
  if (item !== undefined) result.splice(to, 0, item);
  return result;
}

/**
 * Where an item dragged from `from` ends up when dropped into gap `gap` (0 is above the first
 * item, `length` below the last). Gaps below the item shift up by one once it is taken out.
 */
export function dropTarget(from: number, gap: number): number {
  return gap > from ? gap - 1 : gap;
}
