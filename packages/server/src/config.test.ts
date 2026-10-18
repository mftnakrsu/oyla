import { describe, expect, test } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  test('uses defaults for an empty environment', () => {
    const config = loadConfig({});
    expect(config).toMatchObject({
      port: 3000,
      host: '0.0.0.0',
      dbPath: './data/oyla.db',
      createPassword: null,
      retentionDays: 30,
      trustProxy: 0,
      logLevel: 'info',
      rateLimits: { apiPerMinute: 600, createPerHour: 10 },
      maxDbMb: 1024,
    });
    expect(config.webDistPath).toMatch(/web[/\\]dist$/);
  });

  test('reads overrides', () => {
    const config = loadConfig({
      PORT: '8080',
      HOST: '127.0.0.1',
      OYLA_DB_PATH: '/data/oyla.db',
      OYLA_CREATE_PASSWORD: 'secret',
      OYLA_RETENTION_DAYS: '0',
      OYLA_TRUST_PROXY: 'true',
      OYLA_WEB_DIST: '/srv/web',
      OYLA_LOG_LEVEL: 'warn',
      OYLA_RATE_LIMIT_API_PER_MINUTE: '100',
      OYLA_RATE_LIMIT_CREATE_PER_HOUR: '5',
      OYLA_MAX_DB_MB: '0',
    });
    expect(config).toEqual({
      port: 8080,
      host: '127.0.0.1',
      dbPath: '/data/oyla.db',
      createPassword: 'secret',
      retentionDays: 0,
      trustProxy: 1,
      webDistPath: '/srv/web',
      logLevel: 'warn',
      rateLimits: { apiPerMinute: 100, createPerHour: 5 },
      maxDbMb: 0,
    });
  });

  test('trust proxy accepts false, true and a hop count', () => {
    expect(loadConfig({ OYLA_TRUST_PROXY: 'false' }).trustProxy).toBe(0);
    expect(loadConfig({ OYLA_TRUST_PROXY: 'true' }).trustProxy).toBe(1);
    expect(loadConfig({ OYLA_TRUST_PROXY: '2' }).trustProxy).toBe(2);
  });

  test('treats an empty create password as unset', () => {
    expect(loadConfig({ OYLA_CREATE_PASSWORD: '' }).createPassword).toBeNull();
  });

  test('rejects invalid values with a readable message', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
    expect(() => loadConfig({ OYLA_RETENTION_DAYS: '-1' })).toThrow(/OYLA_RETENTION_DAYS/);
    expect(() => loadConfig({ OYLA_TRUST_PROXY: 'maybe' })).toThrow(/OYLA_TRUST_PROXY/);
  });
});
