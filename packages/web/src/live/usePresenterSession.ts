import type { Ack, ErrorCode, Leaderboard, ResultsMessage, ThemeKey } from '@oyla/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createSocket, type OylaSocket } from './socket';
import { deadlineFrom } from './useCountdown';

export type PresenterStatus =
  | 'connecting'
  | 'ready'
  | 'unauthorized'
  | 'not-found'
  | 'ended'
  | 'error';

export interface PresenterSession {
  status: PresenterStatus;
  errorCode: ErrorCode | null;
  connected: boolean;
  /** Null until the first join; follows changes made in the editor. */
  theme: ThemeKey | null;
  activeQuestionId: string | null;
  /** Local timestamp when the active timed question closes; null for untimed ones. */
  closesAt: number | null;
  /** The quiz leaderboard, once loaded. */
  leaderboard: Leaderboard | null;
  /** Increases on every state broadcast, i.e. whenever questions or the active one changed. */
  stateVersion: number;
  participants: number;
  /** Latest results per question id. */
  results: Record<string, ResultsMessage>;
  activate(questionId: string | null): Promise<Ack>;
  reset(questionId: string): Promise<Ack>;
  /** Moderation: hides every answer with this key. */
  hideEntry(questionId: string, key: string): Promise<Ack>;
  /** Moderation: brings back every hidden answer of the question. */
  showHidden(questionId: string): Promise<Ack>;
  /** Moderation: takes a nickname off the leaderboard. */
  hideNickname(id: number): Promise<Ack>;
}

const ACK_TIMEOUT_MS = 10_000;

export function usePresenterSession(
  presentationId: string,
  adminToken: string | null,
): PresenterSession {
  const socketRef = useRef<OylaSocket | null>(null);
  const [status, setStatus] = useState<PresenterStatus>('connecting');
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [connected, setConnected] = useState(false);
  const [theme, setTheme] = useState<ThemeKey | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [closesAt, setClosesAt] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [stateVersion, setStateVersion] = useState(0);
  const [participants, setParticipants] = useState(0);
  const [results, setResults] = useState<Record<string, ResultsMessage>>({});

  useEffect(() => {
    if (!adminToken) return;
    const socket = createSocket();
    socketRef.current = socket;
    const keep = (message: ResultsMessage) =>
      setResults((all) => ({ ...all, [message.questionId]: message }));

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('presenter:join', { presentationId, adminToken }, (ack) => {
        if (ack.ok) {
          setTheme(ack.theme);
          setActiveQuestionId(ack.activeQuestionId);
          setClosesAt(deadlineFrom(ack.closesIn));
          setParticipants(ack.participants);
          socket.emit('presenter:leaderboard', {}, (board) => {
            if (board.ok) setLeaderboard(board.leaderboard);
          });
          if (ack.results) keep(ack.results);
          setStatus('ready');
        } else if (ack.error.code === 'UNAUTHORIZED' || ack.error.code === 'NOT_FOUND') {
          setErrorCode(ack.error.code);
          setStatus(ack.error.code === 'NOT_FOUND' ? 'not-found' : 'unauthorized');
          socket.disconnect();
        } else {
          setErrorCode(ack.error.code);
          setStatus('error');
        }
      });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('presenter:state', (state) => {
      setActiveQuestionId(state.activeQuestionId);
      setClosesAt(deadlineFrom(state.closesIn));
      setStateVersion((version) => version + 1);
    });
    socket.on('results', keep);
    socket.on('leaderboard', setLeaderboard);
    socket.on('presentation', (info) => setTheme(info.theme));
    socket.on('presence', (presence) => setParticipants(presence.participants));
    socket.on('presentation:ended', () => {
      setStatus('ended');
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [presentationId, adminToken]);

  const send = useCallback(
    (
      event:
        | 'presenter:activate'
        | 'presenter:reset'
        | 'presenter:hide-entry'
        | 'presenter:show-hidden'
        | 'presenter:hide-nickname',
      payload: object,
    ) =>
      new Promise<Ack>((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected) {
          resolve({ ok: false, error: { code: 'INTERNAL' } });
          return;
        }
        socket.timeout(ACK_TIMEOUT_MS).emit(event, payload, (error: Error | null, ack: Ack) => {
          resolve(error ? { ok: false, error: { code: 'INTERNAL' } } : ack);
        });
      }),
    [],
  );

  const activate = useCallback(
    async (questionId: string | null) => {
      const ack = await send('presenter:activate', { questionId });
      if (ack.ok) setActiveQuestionId(questionId);
      return ack;
    },
    [send],
  );
  const reset = useCallback(
    (questionId: string) => send('presenter:reset', { questionId }),
    [send],
  );
  const hideEntry = useCallback(
    (questionId: string, key: string) => send('presenter:hide-entry', { questionId, key }),
    [send],
  );
  const showHidden = useCallback(
    (questionId: string) => send('presenter:show-hidden', { questionId }),
    [send],
  );

  const hideNickname = useCallback((id: number) => send('presenter:hide-nickname', { id }), [send]);

  return {
    status,
    errorCode,
    connected,
    theme,
    activeQuestionId,
    closesAt,
    leaderboard,
    stateVersion,
    participants,
    results,
    activate,
    reset,
    hideEntry,
    showHidden,
    hideNickname,
  };
}
