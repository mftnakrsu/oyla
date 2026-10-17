import type { ClientToServerEvents, ServerToClientEvents } from '@oyla/shared';
import { io, type Socket } from 'socket.io-client';

export type OylaSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Same-origin Socket.IO connection that reconnects forever with backoff. */
export function createSocket(): OylaSocket {
  return io({
    transports: ['websocket', 'polling'],
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
  });
}
