import { defineConfig, devices } from '@playwright/test';

const port = 3210;
/** Set to test a running instance (e.g. a Docker container or a deployment) instead of a local build. */
const external = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: external ?? `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Runs the production build: `npm run build` first.
  webServer: external
    ? undefined
    : {
        command: 'node ../packages/server/dist/index.js',
        url: `http://127.0.0.1:${port}/api/health`,
        reuseExistingServer: false,
        env: {
          PORT: String(port),
          HOST: '127.0.0.1',
          OYLA_DB_PATH: ':memory:',
          OYLA_LOG_LEVEL: 'warn',
        },
      },
});
