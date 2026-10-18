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

/** Expected failures as AppError: AppErrors themselves, and a full database. Otherwise null. */
export function asAppError(error: unknown): AppError | null {
  if (error instanceof AppError) return error;
  if (error && typeof error === 'object' && (error as { code?: unknown }).code === 'SQLITE_FULL') {
    return new AppError('STORAGE_FULL', 507, 'The server is out of storage');
  }
  return null;
}
