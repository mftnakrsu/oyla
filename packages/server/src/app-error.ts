import type { ErrorCode } from '@oyla/shared';

/** An expected failure with an error code the clients understand. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    message: string = code,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
