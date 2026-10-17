import { type BuiltApp, buildApp } from './app';
import { type AppConfig, loadConfig } from './config';

export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    ...loadConfig({}),
    dbPath: ':memory:',
    webDistPath: null,
    logLevel: 'silent',
    ...overrides,
  };
}

export async function startTestApp(overrides: Partial<AppConfig> = {}): Promise<BuiltApp> {
  return buildApp(testConfig(overrides));
}
