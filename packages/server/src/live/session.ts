import type { LiveContext, OylaSocket } from './types';
import { rooms } from './types';

/** Takes a socket out of whatever presentation it was part of. */
export function leaveCurrent(
  socket: OylaSocket,
  { broadcaster }: Pick<LiveContext, 'broadcaster'>,
) {
  const { role, presentationId, participantId } = socket.data;
  if (!presentationId) return;
  if (role === 'participant') {
    socket.leave(rooms.participants(presentationId));
    if (participantId) broadcaster.removeParticipant(presentationId, participantId);
  } else if (role === 'presenter') {
    socket.leave(rooms.presenters(presentationId));
  }
  socket.data = {};
}
