import { participantJoinSchema, responseSubmitSchema } from '@oyla/shared';
import { AppError } from '../app-error';
import { handle, parsePayload, rateLimited } from './handle';
import { leaveCurrent } from './session';
import { TokenBucket } from './token-bucket';
import { type LiveContext, type OylaSocket, rooms } from './types';

export function registerParticipantHandlers(socket: OylaSocket, context: LiveContext) {
  const { service, broadcaster, log } = context;
  const joins = new TokenBucket(5, 0.5);
  const submits = new TokenBucket(10, 1);

  socket.on('participant:join', (payload, ack) =>
    handle(log, ack, () => {
      if (!joins.take()) rateLimited();
      const { joinCode, participantId } = parsePayload(participantJoinSchema, payload);
      const presentation = service.joinByCode(joinCode);
      leaveCurrent(socket, context);
      socket.data = { role: 'participant', presentationId: presentation.id, participantId };
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
      return service.submit(presentationId, participantId, questionId, response);
    }),
  );
}
