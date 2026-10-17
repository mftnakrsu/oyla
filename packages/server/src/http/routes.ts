import {
  createPresentationBody,
  createQuestionBody,
  reorderQuestionsBody,
  type ServerConfigDto,
  updatePresentationBody,
  updateQuestionBody,
} from '@oyla/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AppConfig } from '../config';
import type { PresentationService } from '../service';
import { requireAdmin } from './admin';
import { parse } from './errors';

const entityId = z.string().min(1).max(32);
const presentationParams = z.object({ id: entityId });
const questionParams = z.object({ id: entityId, questionId: entityId });

export interface RouteDeps {
  service: PresentationService;
  config: AppConfig;
}

export async function apiRoutes(app: FastifyInstance, { service, config }: RouteDeps) {
  const limited = { rateLimit: { max: config.rateLimits.apiPerMinute, timeWindow: '1 minute' } };

  app.get('/health', async () => ({ status: 'ok' }));

  app.get(
    '/config',
    { config: limited },
    async (): Promise<ServerConfigDto> => ({
      createPasswordRequired: config.createPassword !== null,
      retentionDays: config.retentionDays,
    }),
  );

  app.post(
    '/presentations',
    { config: { rateLimit: { max: config.rateLimits.createPerHour, timeWindow: '1 hour' } } },
    async (request, reply) => {
      const body = parse(createPresentationBody, request.body);
      return reply.status(201).send(service.create(body));
    },
  );

  app.get('/presentations/:id', { config: limited }, async (request) => {
    const { id } = parse(presentationParams, request.params);
    requireAdmin(request, service, id);
    return service.get(id);
  });

  app.patch('/presentations/:id', { config: limited }, async (request) => {
    const { id } = parse(presentationParams, request.params);
    requireAdmin(request, service, id);
    const body = parse(updatePresentationBody, request.body);
    return service.rename(id, body.title);
  });

  app.delete('/presentations/:id', { config: limited }, async (request, reply) => {
    const { id } = parse(presentationParams, request.params);
    requireAdmin(request, service, id);
    service.remove(id);
    return reply.status(204).send();
  });

  app.post('/presentations/:id/questions', { config: limited }, async (request, reply) => {
    const { id } = parse(presentationParams, request.params);
    requireAdmin(request, service, id);
    const body = parse(createQuestionBody, request.body);
    return reply.status(201).send(service.addQuestion(id, body));
  });

  app.put('/presentations/:id/questions/order', { config: limited }, async (request) => {
    const { id } = parse(presentationParams, request.params);
    requireAdmin(request, service, id);
    const body = parse(reorderQuestionsBody, request.body);
    return service.reorder(id, body.ids);
  });

  app.patch('/presentations/:id/questions/:questionId', { config: limited }, async (request) => {
    const { id, questionId } = parse(questionParams, request.params);
    requireAdmin(request, service, id);
    const body = parse(updateQuestionBody, request.body);
    return service.updateQuestion(id, questionId, body);
  });

  app.delete(
    '/presentations/:id/questions/:questionId',
    { config: limited },
    async (request, reply) => {
      const { id, questionId } = parse(questionParams, request.params);
      requireAdmin(request, service, id);
      service.deleteQuestion(id, questionId);
      return reply.status(204).send();
    },
  );

  app.delete(
    '/presentations/:id/questions/:questionId/responses',
    { config: limited },
    async (request, reply) => {
      const { id, questionId } = parse(questionParams, request.params);
      requireAdmin(request, service, id);
      service.resetResults(id, questionId);
      return reply.status(204).send();
    },
  );
}
