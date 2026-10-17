import { z } from 'zod';
import { defaultWebDist } from './paths';

export interface AppConfig {
  port: number;
  host: string;
  dbPath: string;
  /** When set, creating a presentation requires this password. */
  createPassword: string | null;
  /** Presentations idle for this many days are deleted; 0 keeps them forever. */
  retentionDays: number;
  /** Trust X-Forwarded-For from a reverse proxy (Railway, Fly.io, nginx, Caddy…). */
  trustProxy: boolean;
  /** Built web app to serve, or null to run the API only. */
  webDistPath: string | null;
  logLevel: string;
  rateLimits: { apiPerMinute: number; createPerHour: number };
}

const integer = (fallback: number, min: number, max = Number.MAX_SAFE_INTEGER) =>
  z
    .string()
    .regex(/^\d+$/, 'must be a whole number')
    .transform(Number)
    .pipe(z.number().int().min(min).max(max))
    .default(fallback);

const boolean = z
  .enum(['true', 'false', '1', '0', 'yes', 'no'])
  .transform((value) => ['true', '1', 'yes'].includes(value))
  .default(false);

const envSchema = z.object({
  PORT: integer(3000, 0, 65535),
  HOST: z.string().min(1).default('0.0.0.0'),
  OYLA_DB_PATH: z.string().min(1).default('./data/oyla.db'),
  OYLA_CREATE_PASSWORD: z.string().optional(),
  OYLA_RETENTION_DAYS: integer(30, 0),
  OYLA_TRUST_PROXY: boolean,
  OYLA_WEB_DIST: z.string().min(1).optional(),
  OYLA_LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  OYLA_RATE_LIMIT_API_PER_MINUTE: integer(600, 1),
  OYLA_RATE_LIMIT_CREATE_PER_HOUR: integer(30, 1),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid configuration: ${problems}`);
  }
  const values = parsed.data;
  return {
    port: values.PORT,
    host: values.HOST,
    dbPath: values.OYLA_DB_PATH,
    createPassword: values.OYLA_CREATE_PASSWORD || null,
    retentionDays: values.OYLA_RETENTION_DAYS,
    trustProxy: values.OYLA_TRUST_PROXY,
    webDistPath: values.OYLA_WEB_DIST ?? defaultWebDist,
    logLevel: values.OYLA_LOG_LEVEL,
    rateLimits: {
      apiPerMinute: values.OYLA_RATE_LIMIT_API_PER_MINUTE,
      createPerHour: values.OYLA_RATE_LIMIT_CREATE_PER_HOUR,
    },
  };
}
