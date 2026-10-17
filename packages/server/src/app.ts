import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import type { AppConfig } from './config';
import { openDatabase } from './db/client';
import { createLiveEvents } from './events';
import { errorHandler } from './http/errors';
import { apiRoutes } from './http/routes';
import { registerWebApp } from './http/static';
import { createPresentationService, type PresentationService } from './service';
import { createStore, type Store } from './store';

export interface BuiltApp {
  app: FastifyInstance;
  service: PresentationService;
  store: Store;
  close(): Promise<void>;
}

export interface BuildOptions {
  /** Run the hourly retention job. Off in tests. */
  startRetention?: boolean;
}

export async function buildApp(config: AppConfig, _options: BuildOptions = {}): Promise<BuiltApp> {
  const database = openDatabase(config.dbPath);
  const store = createStore(database);
  const events = createLiveEvents();
  const service = createPresentationService({ store, events, config });

  const app = Fastify({
    logger: { level: config.logLevel, redact: ['req.headers.authorization'] },
    bodyLimit: 64 * 1024,
    trustProxy: config.trustProxy,
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
  await app.register(rateLimit, { global: false });
  app.setErrorHandler(errorHandler);
  await app.register(apiRoutes, { prefix: '/api', service, config });
  await registerWebApp(app, config.webDistPath);

  return {
    app,
    service,
    store,
    async close() {
      await app.close();
      database.sqlite.close();
    },
  };
}
