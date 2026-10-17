import type { FastifyRequest } from 'fastify';
import { AppError } from '../app-error';
import type { PresentationService } from '../service';

/** Checks the `Authorization: Bearer <admin token>` header against the presentation. */
export function requireAdmin(
  request: FastifyRequest,
  service: PresentationService,
  presentationId: string,
) {
  const header = request.headers.authorization;
  const match = header ? /^Bearer ([A-Za-z0-9_-]{1,100})$/.exec(header) : null;
  if (!match?.[1]) {
    throw new AppError('UNAUTHORIZED', 401, 'Missing admin link');
  }
  return service.authenticate(presentationId, match[1]);
}
