import { EventEmitter } from 'node:events';

/** What the service tells the live layer. Listeners run synchronously. */
interface LiveEventMap {
  'state-changed': [presentationId: string];
  'results-changed': [presentationId: string, questionId: string];
  'responses-cleared': [presentationId: string, questionId: string];
  'presentation-ended': [presentationId: string];
}

export type LiveEvents = EventEmitter<LiveEventMap>;

export function createLiveEvents(): LiveEvents {
  return new EventEmitter<LiveEventMap>();
}
