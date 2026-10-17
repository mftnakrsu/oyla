import { describe, expect, test, vi } from 'vitest';
import { loadConfig } from './config';
import { openDatabase } from './db/client';
import { createLiveEvents } from './events';
import { runRetention } from './retention';
import { createPresentationService } from './service';
import { createStore } from './store';

const DAY = 24 * 60 * 60 * 1000;

function setup() {
  const store = createStore(openDatabase(':memory:'));
  const events = createLiveEvents();
  let clock = 100 * DAY;
  const service = createPresentationService({
    store,
    events,
    config: loadConfig({}),
    now: () => clock,
  });
  return { store, events, service, setClock: (value: number) => (clock = value) };
}

describe('runRetention', () => {
  test('deletes presentations idle longer than the window and announces it', () => {
    const { store, events, service, setClock } = setup();
    setClock(10 * DAY);
    const old = service.create({ title: 'Old' });
    setClock(95 * DAY);
    const recent = service.create({ title: 'Recent' });
    const ended = vi.fn();
    events.on('presentation-ended', ended);

    const deleted = runRetention({ store, events, retentionDays: 30, now: 100 * DAY });

    expect(deleted).toBe(1);
    expect(store.presentations.get(old.id)).toBeUndefined();
    expect(store.presentations.get(recent.id)).toBeDefined();
    expect(ended).toHaveBeenCalledWith(old.id);
  });

  test('retentionDays 0 keeps everything', () => {
    const { store, events, service, setClock } = setup();
    setClock(0);
    const old = service.create({ title: 'Old' });
    expect(runRetention({ store, events, retentionDays: 0, now: 1000 * DAY })).toBe(0);
    expect(store.presentations.get(old.id)).toBeDefined();
  });
});
