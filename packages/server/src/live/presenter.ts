import { presenterActivateSchema, presenterJoinSchema, presenterResetSchema } from '@oyla/shared';
import { AppError } from '../app-error';
import { handle, parsePayload, rateLimited } from './handle';
import { leaveCurrent } from './session';
import { TokenBucket } from './token-bucket';
import { type LiveContext, type OylaSocket, rooms } from './types';

export function registerPresenterHandlers(socket: OylaSocket, context: LiveContext) {
  const { service, broadcaster, log } = context;
  const joins = new TokenBucket(5, 0.5);
  const commands = new TokenBucket(20, 5);

  function requirePresenter(): string {
    const { role, presentationId } = socket.data;
    if (role !== 'presenter' || !presentationId) {
      throw new AppError('UNAUTHORIZED', 401, 'Not a presenter');
    }
    if (!commands.take()) rateLimited();
    return presentationId;
  }

  socket.on('presenter:join', (payload, ack) =>
    handle(log, ack, () => {
      if (!joins.take()) rateLimited();
      const { presentationId, adminToken } = parsePayload(presenterJoinSchema, payload);
      const presentation = service.authenticate(presentationId, adminToken);
      leaveCurrent(socket, context);
      socket.data = { role: 'presenter', presentationId };
      socket.join(rooms.presenters(presentationId));
      return {
        title: presentation.title,
        activeQuestionId: presentation.activeQuestionId,
        participants: broadcaster.participantCount(presentationId),
        results: presentation.activeQuestionId
          ? service.results(presentationId, presentation.activeQuestionId)
          : null,
      };
    }),
  );

  socket.on('presenter:activate', (payload, ack) =>
    handle(log, ack, () => {
      const presentationId = requirePresenter();
      const { questionId } = parsePayload(presenterActivateSchema, payload);
      service.activate(presentationId, questionId);
      return {};
    }),
  );

  socket.on('presenter:reset', (payload, ack) =>
    handle(log, ack, () => {
      const presentationId = requirePresenter();
      const { questionId } = parsePayload(presenterResetSchema, payload);
      service.resetResults(presentationId, questionId);
      return {};
    }),
  );
}
