import type { Ack } from '@oyla/shared';
import type { FastifyBaseLogger } from 'fastify';
import type { z } from 'zod';
import { AppError, asAppError } from '../app-error';

/**
 * Runs a socket handler and always answers through the acknowledgement callback.
 * Errors never escape: expected ones become error codes, unexpected ones are logged.
 */
export function handle<T extends object>(log: FastifyBaseLogger, ack: unknown, run: () => T): void {
  if (typeof ack !== 'function') {
    return;
  }
  const reply = ack as (result: Ack<T>) => void;
  try {
    reply({ ok: true, ...run() });
  } catch (error) {
    const expected = asAppError(error);
    if (expected) {
      reply({ ok: false, error: { code: expected.code } });
      return;
    }
    log.error({ err: error }, 'Socket handler failed');
    reply({ ok: false, error: { code: 'INTERNAL' } });
  }
}

export function parsePayload<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new AppError('VALIDATION_FAILED', 400, 'Invalid payload');
  }
  return result.data;
}

export function rateLimited(): never {
  throw new AppError('RATE_LIMITED', 429, 'Too many requests');
}
