import { describe, expect, test } from 'vitest';
import { dropTarget, moveItem } from './move';

describe('moveItem', () => {
  test('moves an item to the given index', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });

  test('returns an unchanged copy for indexes out of range', () => {
    const list = ['a', 'b'];
    const moved = moveItem(list, 0, 5);
    expect(moved).toEqual(['a', 'b']);
    expect(moved).not.toBe(list);
    expect(moveItem(list, -1, 0)).toEqual(['a', 'b']);
  });
});

describe('dropTarget', () => {
  test('turns a gap between items into the index the item ends up at', () => {
    // Gaps of a four-item list: 0 is above the first item, 4 below the last.
    expect(dropTarget(3, 0)).toBe(0);
    expect(dropTarget(0, 4)).toBe(3);
    expect(dropTarget(1, 3)).toBe(2);
    // The gaps right above and below the dragged item leave it where it is.
    expect(dropTarget(1, 1)).toBe(1);
    expect(dropTarget(1, 2)).toBe(1);
  });
});
