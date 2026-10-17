import type { ApiErrorBody, ErrorCode } from '@oyla/shared';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError, type z } from 'zod';
import { AppError } from '../app-error';

function send(reply: FastifyReply, status: number, code: ErrorCode, message: string) {
  const body: ApiErrorBody = { error: { code, message } };
  return reply.status(status).send(body);
}

/** Parses untrusted input or fails with VALIDATION_FAILED. */
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError('VALIDATION_FAILED', 400, 'Invalid request');
  }
  return result.data;
}

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return send(reply, error.status, error.code, error.message);
  }
  if (error instanceof ZodError) {
    return send(reply, 400, 'VALIDATION_FAILED', 'Invalid request');
  }
  const status = error.statusCode ?? 500;
  if (status === 429) {
    return send(reply, 429, 'RATE_LIMITED', 'Too many requests, slow down');
  }
  if (status >= 400 && status < 500) {
    // Fastify's own client errors: malformed JSON, body too large, unsupported media type…
    return send(reply, status, 'VALIDATION_FAILED', 'Invalid request');
  }
  request.log.error({ err: error }, 'Unhandled error');
  return send(reply, 500, 'INTERNAL', 'Something went wrong');
}

export function notFound(reply: FastifyReply) {
  return send(reply, 404, 'NOT_FOUND', 'Not found');
}
