import type { FastifyBaseLogger } from 'fastify';
import type { LiveEvents } from './events';
import type { Store } from './store';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

interface RetentionDeps {
  store: Store;
  events: LiveEvents;
  retentionDays: number;
}

/** Deletes presentations nobody has used for `retentionDays`. Returns how many were deleted. */
export function runRetention({
  store,
  events,
  retentionDays,
  now,
}: RetentionDeps & { now: number }): number {
  if (retentionDays <= 0) {
    return 0;
  }
  const ids = store.presentations.idleIds(now - retentionDays * DAY_MS);
  for (const id of ids) {
    store.presentations.delete(id);
    events.emit('presentation-ended', id);
  }
  return ids.length;
}

/** Runs the retention sweep now and then every hour. Returns a function that stops it. */
export function startRetentionJob(deps: RetentionDeps & { log: FastifyBaseLogger }): () => void {
  const sweep = () => {
    try {
      const deleted = runRetention({ ...deps, now: Date.now() });
      if (deleted > 0) {
        deps.log.info({ deleted }, 'Deleted idle presentations');
      }
    } catch (error) {
      deps.log.error({ err: error }, 'Retention sweep failed');
    }
  };
  sweep();
  const timer = setInterval(sweep, HOUR_MS);
  timer.unref();
  return () => clearInterval(timer);
}
