import type { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import type { AppConfig } from '../config';
import type { LiveEvents } from '../events';
import type { PresentationService } from '../service';
import { createBroadcaster } from './broadcaster';
import { registerParticipantHandlers } from './participant';
import { registerPresenterHandlers } from './presenter';
import { leaveCurrent } from './session';
import type { LiveContext, OylaServer, OylaSocket } from './types';

/** Generous on purpose: a whole classroom often shares one public IP. */
const MAX_SOCKETS_PER_IP = 500;

function clientIp(socket: OylaSocket, trustedHops: number): string {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  if (trustedHops > 0 && typeof forwarded === 'string') {
    const chain = forwarded.split(',').map((part) => part.trim());
    const ip = chain[chain.length - trustedHops];
    if (ip) return ip;
  }
  return socket.handshake.address;
}

export function attachLive(
  app: FastifyInstance,
  deps: { service: PresentationService; events: LiveEvents; config: AppConfig },
) {
  const io: OylaServer = new Server(app.server, {
    serveClient: false,
    maxHttpBufferSize: 16 * 1024,
    pingInterval: 20_000,
    pingTimeout: 20_000,
  });
  const log = app.log.child({ module: 'live' });
  const broadcaster = createBroadcaster(io, deps.service, deps.events, log);
  const context: LiveContext = { io, log, broadcaster, ...deps };
  const socketsPerIp = new Map<string, number>();

  io.use((socket, next) => {
    const ip = clientIp(socket, deps.config.trustProxy);
    const count = socketsPerIp.get(ip) ?? 0;
    if (count >= MAX_SOCKETS_PER_IP) {
      next(new Error('RATE_LIMITED'));
      return;
    }
    socketsPerIp.set(ip, count + 1);
    socket.once('disconnect', () => {
      const remaining = (socketsPerIp.get(ip) ?? 1) - 1;
      if (remaining <= 0) socketsPerIp.delete(ip);
      else socketsPerIp.set(ip, remaining);
    });
    next();
  });

  io.on('connection', (socket) => {
    registerParticipantHandlers(socket, context);
    registerPresenterHandlers(socket, context);
    socket.on('disconnect', () => leaveCurrent(socket, context));
  });

  return {
    io,
    close() {
      broadcaster.dispose();
      io.disconnectSockets(true);
      io.engine.close();
    },
  };
}
