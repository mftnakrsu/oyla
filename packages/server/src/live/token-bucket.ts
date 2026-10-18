/** Allows bursts of `capacity` actions, refilled at `refillPerSecond`. */
export class TokenBucket {
  private tokens: number;
  private updatedAt: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number,
    private readonly now: () => number = Date.now,
  ) {
    this.tokens = capacity;
    this.updatedAt = now();
  }

  private refill(): void {
    const time = this.now();
    this.tokens = Math.min(
      this.capacity,
      this.tokens + ((time - this.updatedAt) / 1000) * this.refillPerSecond,
    );
    this.updatedAt = time;
  }

  take(): boolean {
    this.refill();
    if (this.tokens < 1) {
      return false;
    }
    this.tokens -= 1;
    return true;
  }

  /** True when at least one token is left, without using it. */
  available(): boolean {
    this.refill();
    return this.tokens >= 1;
  }

  /** True when the bucket is back at capacity, i.e. indistinguishable from a new one. */
  full(): boolean {
    this.refill();
    return this.tokens >= this.capacity;
  }
}
