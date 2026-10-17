import type { ClientToServerEvents, ServerToClientEvents } from '@oyla/shared';
import type { FastifyBaseLogger } from 'fastify';
import type { Server, Socket } from 'socket.io';
import type { AppConfig } from '../config';
import type { LiveEvents } from '../events';
import type { PresentationService } from '../service';
import type { Broadcaster } from './broadcaster';

export interface SocketData {
  role?: 'participant' | 'presenter';
  presentationId?: string;
  participantId?: string;
}

export type OylaServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
export type OylaSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export interface LiveContext {
  io: OylaServer;
  service: PresentationService;
  events: LiveEvents;
  config: AppConfig;
  log: FastifyBaseLogger;
  broadcaster: Broadcaster;
}

export const rooms = {
  participants: (presentationId: string) => `p:${presentationId}:participants`,
  presenters: (presentationId: string) => `p:${presentationId}:presenters`,
};
