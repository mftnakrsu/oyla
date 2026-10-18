import helmet from '@fastify/helmet';
import Fastify, { type FastifyInstance } from 'fastify';
import type { AppConfig } from './config';
import { openDatabase } from './db/client';
import { createLiveEvents } from './events';
import { errorHandler } from './http/errors';
import { apiRoutes } from './http/routes';
import { registerWebApp } from './http/static';
import { attachLive } from './live/hub';
import type { OylaServer } from './live/types';
import { startRetentionJob } from './retention';
import { createPresentationService, type PresentationService } from './service';
import { createStore, type Store } from './store';

export interface BuiltApp {
  app: FastifyInstance;
  io: OylaServer;
  /** False when no built web app was found (API-only mode). */
  hasWebApp: boolean;
  service: PresentationService;
  store: Store;
  close(): Promise<void>;
}

export interface BuildOptions {
  /** Run the hourly retention job. Off in tests. */
  startRetention?: boolean;
}

export async function buildApp(config: AppConfig, options: BuildOptions = {}): Promise<BuiltApp> {
  const database = openDatabase(config.dbPath, { maxDbMb: config.maxDbMb });
  const store = createStore(database);
  const events = createLiveEvents();
  const service = createPresentationService({ store, events, config });

  const app = Fastify({
    logger: { level: config.logLevel, redact: ['req.headers.authorization'] },
    bodyLimit: 64 * 1024,
    // Trusting only the first N hops makes Fastify read the client IP from the right end of
    // X-Forwarded-For, where the trusted proxy wrote it, instead of the spoofable left end.
    trustProxy:
      config.trustProxy > 0 ? (_address: string, hop: number) => hop < config.trustProxy : false,
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  });
  app.setErrorHandler(errorHandler);
  await app.register(apiRoutes, { prefix: '/api', service, config });
  const hasWebApp = await registerWebApp(app, config.webDistPath);
  const live = attachLive(app, { service, events, config });
  const stopRetention = options.startRetention
    ? startRetentionJob({ store, events, retentionDays: config.retentionDays, log: app.log })
    : () => {};

  return {
    app,
    io: live.io,
    hasWebApp,
    service,
    store,
    async close() {
      stopRetention();
      live.close();
      await app.close();
      database.sqlite.close();
    },
  };
}
