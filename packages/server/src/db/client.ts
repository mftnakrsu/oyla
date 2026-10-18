import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { type BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { migrationsFolder } from '../paths';
import * as schema from './schema';

export type Db = BetterSQLite3Database<typeof schema>;

export interface DatabaseHandle {
  db: Db;
  sqlite: Database.Database;
}

/**
 * Opens (or creates) the SQLite file and brings its schema up to date. `maxDbMb` caps the file
 * size; writes beyond it fail with SQLITE_FULL instead of filling the disk.
 */
export function openDatabase(
  path: string,
  { maxDbMb = 0 }: { maxDbMb?: number } = {},
): DatabaseHandle {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  if (maxDbMb > 0) {
    const pageSize = Number(sqlite.pragma('page_size', { simple: true }));
    sqlite.pragma(`max_page_count = ${Math.floor((maxDbMb * 1024 * 1024) / pageSize)}`);
  }
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder });
  return { db, sqlite };
}
