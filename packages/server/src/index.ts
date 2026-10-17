import { buildApp } from './app';
import { loadConfig } from './config';

async function main() {
  const config = loadConfig();
  const { app, close, hasWebApp } = await buildApp(config, { startRetention: true });

  let closing = false;
  const shutdown = async (signal: string) => {
    if (closing) return;
    closing = true;
    app.log.info({ signal }, 'Shutting down');
    await close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: config.port, host: config.host });
  if (!hasWebApp) {
    app.log.warn(
      { webDistPath: config.webDistPath },
      'No built web app found; serving the API only',
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
