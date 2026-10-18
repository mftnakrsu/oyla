import type { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import type { AppConfig } from '../config';
import type { LiveEvents } from '../events';
import type { PresentationService } from '../service';
import { createBroadcaster } from './broadcaster';
import { clientIp, sameOrigin } from './client-ip';
import { IpLimits, MAX_SOCKETS_PER_IP } from './ip-limits';
import { registerParticipantHandlers } from './participant';
import { registerPresenterHandlers } from './presenter';
import { leaveCurrent } from './session';
import type { LiveContext, OylaServer } from './types';

export function attachLive(
  app: FastifyInstance,
  deps: { service: PresentationService; events: LiveEvents; config: AppConfig },
) {
  const hops = deps.config.trustProxy;
  const limits = new IpLimits();

  const io: OylaServer = new Server(app.server, {
    serveClient: false,
    maxHttpBufferSize: 16 * 1024,
    pingInterval: 20_000,
    pingTimeout: 20_000,
    // Connections that never send the Socket.IO CONNECT packet are dropped quickly.
    connectTimeout: 10_000,
    allowRequest(request, callback) {
      // A page on another site must not open sockets with its visitors' IPs.
      if (!sameOrigin(request, hops)) {
        callback('Origin not allowed', false);
        return;
      }
      // Limits apply to new connections only; follow-up polling requests carry a session id.
      const isHandshake = !new URL(request.url ?? '/', 'http://localhost').searchParams.has('sid');
      if (isHandshake) {
        const ip = clientIp(request, hops);
        if (limits.socketCount(ip) >= MAX_SOCKETS_PER_IP || !limits.takeHandshake(ip)) {
          callback('Too many connections', false);
          return;
        }
      }
      callback(null, true);
    },
  });

  // Counted at the engine level: its close event fires for every connection, including ones that
  // end before the Socket.IO handshake, so the counter cannot leak.
  io.engine.on(
    'connection',
    (raw: {
      request: Parameters<typeof clientIp>[0];
      once(event: 'close', fn: () => void): void;
    }) => {
      const ip = clientIp(raw.request, hops);
      limits.addSocket(ip);
      raw.once('close', () => limits.removeSocket(ip));
    },
  );

  const log = app.log.child({ module: 'live' });
  const broadcaster = createBroadcaster(io, deps.service, deps.events, log);
  const context: LiveContext = { io, log, broadcaster, limits, ...deps };

  const onCleared = (presentationId: string, questionId: string) =>
    limits.clearAnswers(presentationId, questionId);
  const onEnded = (presentationId: string) => limits.clearAnswers(presentationId);
  deps.events.on('responses-cleared', onCleared);
  deps.events.on('presentation-ended', onEnded);

  io.on('connection', (socket) => {
    socket.data = { ip: clientIp(socket.request, hops) };
    registerParticipantHandlers(socket, context);
    registerPresenterHandlers(socket, context);
    socket.on('disconnect', () => leaveCurrent(socket, context));
  });

  return {
    io,
    close() {
      deps.events.off('responses-cleared', onCleared);
      deps.events.off('presentation-ended', onEnded);
      broadcaster.dispose();
      limits.dispose();
      io.disconnectSockets(true);
      io.engine.close();
    },
  };
}
