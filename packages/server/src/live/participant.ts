import { participantJoinSchema, responseSubmitSchema } from '@oyla/shared';
import { AppError } from '../app-error';
import { handle, parsePayload, rateLimited } from './handle';
import { ANSWERS_PER_IP_PER_QUESTION } from './ip-limits';
import { leaveCurrent } from './session';
import { TokenBucket } from './token-bucket';
import { type LiveContext, type OylaSocket, rooms } from './types';

export function registerParticipantHandlers(socket: OylaSocket, context: LiveContext) {
  const { service, broadcaster, limits, log } = context;
  const joins = new TokenBucket(5, 0.5);
  const submits = new TokenBucket(10, 1);
  const ip = () => socket.data.ip ?? 'unknown';

  socket.on('participant:join', (payload, ack) =>
    handle(log, ack, () => {
      if (!joins.take() || !limits.canTryJoin(ip())) rateLimited();
      const { joinCode, participantId } = parsePayload(participantJoinSchema, payload);
      let presentation: ReturnType<typeof service.joinByCode>;
      try {
        presentation = service.joinByCode(joinCode);
      } catch (error) {
        // Only wrong codes count, so a classroom joining a real code is never slowed down.
        if (error instanceof AppError && error.code === 'JOIN_CODE_NOT_FOUND')
          limits.recordFailedJoin(ip());
        throw error;
      }
      leaveCurrent(socket, context);
      socket.data = {
        ip: socket.data.ip,
        role: 'participant',
        presentationId: presentation.id,
        participantId,
      };
      socket.join(rooms.participants(presentation.id));
      broadcaster.addParticipant(presentation.id, participantId);
      return {
        presentationId: presentation.id,
        title: presentation.title,
        state: service.participantState(presentation.id, participantId),
      };
    }),
  );

  socket.on('response:submit', (payload, ack) =>
    handle(log, ack, () => {
      const { role, presentationId, participantId } = socket.data;
      if (role !== 'participant' || !presentationId || !participantId) {
        throw new AppError('UNAUTHORIZED', 401, 'Join a presentation first');
      }
      if (!submits.take()) rateLimited();
      const { questionId, response } = parsePayload(responseSubmitSchema, payload);
      if (limits.answerCount(presentationId, questionId, ip()) >= ANSWERS_PER_IP_PER_QUESTION)
        rateLimited();
      const result = service.submit(presentationId, participantId, questionId, response);
      limits.recordAnswer(presentationId, questionId, ip());
      return result;
    }),
  );
}
