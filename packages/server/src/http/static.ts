import { existsSync } from 'node:fs';
import { join } from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { notFound } from './errors';

/** Serves the built web app, falling back to index.html so client-side routes work on reload. */
export async function registerWebApp(
  app: FastifyInstance,
  webDistPath: string | null,
): Promise<boolean> {
  const hasWebApp = webDistPath !== null && existsSync(join(webDistPath, 'index.html'));
  if (hasWebApp) {
    await app.register(fastifyStatic, {
      root: webDistPath,
      cacheControl: false,
      setHeaders(reply, path) {
        // Vite fingerprints everything under assets/, so it can be cached forever.
        const immutable = path.startsWith(join(webDistPath, 'assets'));
        reply.header(
          'cache-control',
          immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
        );
      },
    });
  }

  app.setNotFoundHandler((request, reply) => {
    const path = request.url.split('?')[0] ?? '';
    const isAppRoute =
      hasWebApp &&
      (request.method === 'GET' || request.method === 'HEAD') &&
      !path.startsWith('/api/') &&
      !path.startsWith('/socket.io/') &&
      !path.startsWith('/assets/');
    if (isAppRoute) {
      reply.header('cache-control', 'no-cache');
      return reply.sendFile('index.html');
    }
    return notFound(reply);
  });
  return hasWebApp;
}
