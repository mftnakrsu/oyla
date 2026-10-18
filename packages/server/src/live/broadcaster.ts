import type { FastifyBaseLogger } from 'fastify';
import { AppError } from '../app-error';
import type { LiveEvents } from '../events';
import type { PresentationService } from '../service';
import { type OylaServer, rooms } from './types';

const RESULTS_THROTTLE_MS = 250;
const STATE_DEBOUNCE_MS = 30;
const PRESENCE_THROTTLE_MS = 500;

export type Broadcaster = ReturnType<typeof createBroadcaster>;

/**
 * Turns service events into socket messages. Results are throttled per question so a burst of
 * votes becomes a few messages; presence is tracked in memory (one process, see ROADMAP for Redis).
 */
export function createBroadcaster(
  io: OylaServer,
  service: PresentationService,
  events: LiveEvents,
  log: FastifyBaseLogger,
) {
  /** presentationId → participantId → number of connected sockets */
  const presence = new Map<string, Map<string, number>>();
  const timers = new Map<string, NodeJS.Timeout>();

  function later(key: string, delay: number, run: () => void) {
    if (timers.has(key)) {
      return;
    }
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        run();
      }, delay),
    );
  }

  function ignoreMissing(run: () => void) {
    try {
      run();
    } catch (error) {
      if (error instanceof AppError && error.code === 'NOT_FOUND') {
        return; // deleted in the meantime
      }
      log.error({ err: error }, 'Broadcast failed');
    }
  }

  function hasPresenters(presentationId: string): boolean {
    return (io.sockets.adapter.rooms.get(rooms.presenters(presentationId))?.size ?? 0) > 0;
  }

  function sendResults(presentationId: string, questionId: string) {
    // Aggregating can be costly (thousands of answers); skip it when nobody is watching.
    if (!hasPresenters(presentationId)) return;
    ignoreMissing(() => {
      io.to(rooms.presenters(presentationId)).emit(
        'results',
        service.results(presentationId, questionId),
      );
    });
  }

  async function sendState(presentationId: string) {
    const sockets = await io.in(rooms.participants(presentationId)).fetchSockets();
    ignoreMissing(() => {
      const activeQuestionId = service.activeQuestionId(presentationId);
      const ids = [
        ...new Set(
          sockets.map((socket) => socket.data.participantId).filter((id): id is string => !!id),
        ),
      ];
      // One batched lookup for everyone instead of a few queries per participant.
      const states = service.participantStates(presentationId, ids);
      for (const socket of sockets) {
        const state = socket.data.participantId ? states.get(socket.data.participantId) : undefined;
        if (state) socket.emit('state', state);
      }
      io.to(rooms.presenters(presentationId)).emit('presenter:state', { activeQuestionId });
      if (activeQuestionId) {
        sendResults(presentationId, activeQuestionId);
      }
    });
  }

  function sendPresence(presentationId: string) {
    io.to(rooms.presenters(presentationId)).emit('presence', {
      participants: participantCount(presentationId),
    });
  }

  function participantCount(presentationId: string): number {
    return presence.get(presentationId)?.size ?? 0;
  }

  function onStateChanged(presentationId: string) {
    later(`state:${presentationId}`, STATE_DEBOUNCE_MS, () => {
      sendState(presentationId).catch((error) =>
        log.error({ err: error }, 'State broadcast failed'),
      );
    });
  }

  function onResultsChanged(presentationId: string, questionId: string) {
    later(`results:${presentationId}:${questionId}`, RESULTS_THROTTLE_MS, () =>
      sendResults(presentationId, questionId),
    );
  }

  function onPresentationChanged(presentationId: string) {
    ignoreMissing(() => {
      io.to(rooms.participants(presentationId))
        .to(rooms.presenters(presentationId))
        .emit('presentation', service.info(presentationId));
    });
  }

  function onPresentationEnded(presentationId: string) {
    const participants = rooms.participants(presentationId);
    const presenters = rooms.presenters(presentationId);
    io.to(participants).to(presenters).emit('presentation:ended');
    io.in(participants).socketsLeave(participants);
    io.in(presenters).socketsLeave(presenters);
    presence.delete(presentationId);
    for (const [key, timer] of timers) {
      if (key.includes(`:${presentationId}`)) {
        clearTimeout(timer);
        timers.delete(key);
      }
    }
  }

  events.on('state-changed', onStateChanged);
  events.on('results-changed', onResultsChanged);
  events.on('presentation-changed', onPresentationChanged);
  events.on('presentation-ended', onPresentationEnded);

  return {
    participantCount,

    addParticipant(presentationId: string, participantId: string) {
      const counts = presence.get(presentationId) ?? new Map<string, number>();
      counts.set(participantId, (counts.get(participantId) ?? 0) + 1);
      presence.set(presentationId, counts);
      later(`presence:${presentationId}`, PRESENCE_THROTTLE_MS, () => sendPresence(presentationId));
    },

    removeParticipant(presentationId: string, participantId: string) {
      const counts = presence.get(presentationId);
      const current = counts?.get(participantId);
      if (!counts || current === undefined) return;
      if (current <= 1) {
        counts.delete(participantId);
      } else {
        counts.set(participantId, current - 1);
      }
      if (counts.size === 0) {
        presence.delete(presentationId);
      }
      later(`presence:${presentationId}`, PRESENCE_THROTTLE_MS, () => sendPresence(presentationId));
    },

    dispose() {
      events.off('state-changed', onStateChanged);
      events.off('results-changed', onResultsChanged);
      events.off('presentation-changed', onPresentationChanged);
      events.off('presentation-ended', onPresentationEnded);
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    },
  };
}
