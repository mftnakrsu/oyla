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

  take(): boolean {
    const time = this.now();
    const refill = ((time - this.updatedAt) / 1000) * this.refillPerSecond;
    this.tokens = Math.min(this.capacity, this.tokens + refill);
    this.updatedAt = time;
    if (this.tokens < 1) {
      return false;
    }
    this.tokens -= 1;
    return true;
  }
}
