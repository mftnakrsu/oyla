import { TokenBucket } from './token-bucket';

/** Generous on purpose: a whole classroom often shares one public IP. */
export const MAX_SOCKETS_PER_IP = 500;
/** New connections per IP: a class of 100 joining at once fits in the burst. */
const HANDSHAKE_BURST = 150;
const HANDSHAKES_PER_SECOND = 5;
/** Wrong join codes per IP across all its sockets: a few typos are fine, scanning is not. */
const FAILED_JOIN_BURST = 20;
const FAILED_JOINS_PER_SECOND = 0.1;
/** Answers per IP to one question, so one device cannot fill a question for everyone. */
export const ANSWERS_PER_IP_PER_QUESTION = 600;

/**
 * In-memory limits keyed by client IP (see client-ip.ts). Lives as long as the process; with
 * several servers these would move to Redis (ROADMAP).
 */
export class IpLimits {
  private readonly sockets = new Map<string, number>();
  private readonly handshakes = new Map<string, TokenBucket>();
  private readonly failedJoins = new Map<string, TokenBucket>();
  /** presentationId → questionId → ip → answers */
  private readonly answers = new Map<string, Map<string, Map<string, number>>>();
  private readonly sweeper: NodeJS.Timeout;

  constructor() {
    // Buckets that have refilled completely carry no information; drop them to bound memory.
    this.sweeper = setInterval(() => {
      for (const map of [this.handshakes, this.failedJoins]) {
        for (const [ip, bucket] of map) if (bucket.full()) map.delete(ip);
      }
    }, 60_000);
    this.sweeper.unref();
  }

  socketCount(ip: string): number {
    return this.sockets.get(ip) ?? 0;
  }

  addSocket(ip: string): void {
    this.sockets.set(ip, this.socketCount(ip) + 1);
  }

  removeSocket(ip: string): void {
    const remaining = this.socketCount(ip) - 1;
    if (remaining <= 0) this.sockets.delete(ip);
    else this.sockets.set(ip, remaining);
  }

  takeHandshake(ip: string): boolean {
    return bucketFor(this.handshakes, ip, HANDSHAKE_BURST, HANDSHAKES_PER_SECOND).take();
  }

  canTryJoin(ip: string): boolean {
    return bucketFor(this.failedJoins, ip, FAILED_JOIN_BURST, FAILED_JOINS_PER_SECOND).available();
  }

  recordFailedJoin(ip: string): void {
    bucketFor(this.failedJoins, ip, FAILED_JOIN_BURST, FAILED_JOINS_PER_SECOND).take();
  }

  answerCount(presentationId: string, questionId: string, ip: string): number {
    return this.answers.get(presentationId)?.get(questionId)?.get(ip) ?? 0;
  }

  recordAnswer(presentationId: string, questionId: string, ip: string): void {
    const byQuestion = this.answers.get(presentationId) ?? new Map<string, Map<string, number>>();
    const byIp = byQuestion.get(questionId) ?? new Map<string, number>();
    byIp.set(ip, (byIp.get(ip) ?? 0) + 1);
    byQuestion.set(questionId, byIp);
    this.answers.set(presentationId, byQuestion);
  }

  clearAnswers(presentationId: string, questionId?: string): void {
    if (questionId === undefined) this.answers.delete(presentationId);
    else this.answers.get(presentationId)?.delete(questionId);
  }

  dispose(): void {
    clearInterval(this.sweeper);
  }
}

function bucketFor(
  map: Map<string, TokenBucket>,
  ip: string,
  capacity: number,
  perSecond: number,
): TokenBucket {
  let bucket = map.get(ip);
  if (!bucket) {
    bucket = new TokenBucket(capacity, perSecond);
    map.set(ip, bucket);
  }
  return bucket;
}
