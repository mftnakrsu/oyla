import { describe, expect, test } from 'vitest';
import { TokenBucket } from './token-bucket';

describe('TokenBucket', () => {
  test('allows a burst up to its capacity, then refills over time', () => {
    let now = 0;
    const bucket = new TokenBucket(3, 1, () => now);
    expect([bucket.take(), bucket.take(), bucket.take(), bucket.take()]).toEqual([
      true,
      true,
      true,
      false,
    ]);
    now += 1000;
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(false);
  });

  test('never holds more than its capacity', () => {
    let now = 0;
    const bucket = new TokenBucket(2, 10, () => now);
    now += 60_000;
    expect([bucket.take(), bucket.take(), bucket.take()]).toEqual([true, true, false]);
  });
});
