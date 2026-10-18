export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'NOT_FOUND',
  'UNAUTHORIZED',
  'CREATE_PASSWORD_REQUIRED',
  'CREATE_PASSWORD_INVALID',
  'RATE_LIMITED',
  'JOIN_CODE_NOT_FOUND',
  'QUESTION_NOT_ACTIVE',
  'RESPONSE_LIMIT_REACHED',
  'QUESTION_LIMIT_REACHED',
  'QUESTION_FULL',
  'PRESENTATION_FULL',
  'STORAGE_FULL',
  'INTERNAL',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && (ERROR_CODES as readonly string[]).includes(value);
}
