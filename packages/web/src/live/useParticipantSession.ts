import type {
  ErrorCode,
  NicknameAck,
  ParticipantState,
  ResponseSubmitAck,
  ThemeKey,
} from '@oyla/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getParticipantId } from '../lib/participant';
import { createSocket, type OylaSocket } from './socket';
import { deadlineFrom } from './useCountdown';

export type ParticipantStatus = 'connecting' | 'ready' | 'not-found' | 'ended' | 'error';

export interface ParticipantSession {
  status: ParticipantStatus;
  errorCode: ErrorCode | null;
  connected: boolean;
  title: string;
  /** Null until joined; follows changes the presenter makes. */
  theme: ThemeKey | null;
  state: ParticipantState | null;
  /** Local timestamp when the active timed question closes; null for untimed ones. */
  closesAt: number | null;
  submit(questionId: string, response: unknown): Promise<ResponseSubmitAck>;
  /** Marks the question as fully answered (the server said no answers are left). */
  markAnswered(questionId: string): void;
  /** Picks the leaderboard name (quiz). */
  setNickname(nickname: string): Promise<NicknameAck>;
}

const ACK_TIMEOUT_MS = 10_000;

/**
 * Joins a presentation by code and re-joins after every reconnect; the server owns the state.
 * Pass null for a malformed code: nothing connects.
 */
export function useParticipantSession(joinCode: string | null): ParticipantSession {
  const socketRef = useRef<OylaSocket | null>(null);
  const [status, setStatus] = useState<ParticipantStatus>('connecting');
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [connected, setConnected] = useState(false);
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState<ThemeKey | null>(null);
  const [state, setState] = useState<ParticipantState | null>(null);
  const [closesAt, setClosesAt] = useState<number | null>(null);
  // Every state from the server carries a fresh "closes in"; turn it into a local deadline.
  const receive = useCallback((next: ParticipantState) => {
    setState(next);
    setClosesAt(deadlineFrom(next.activeQuestion?.closesIn));
  }, []);

  useEffect(() => {
    if (joinCode === null) return;
    const socket = createSocket();
    socketRef.current = socket;
    const participantId = getParticipantId();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('participant:join', { joinCode, participantId }, (ack) => {
        if (ack.ok) {
          setTitle(ack.title);
          setTheme(ack.theme);
          receive(ack.state);
          setStatus('ready');
        } else if (ack.error.code === 'JOIN_CODE_NOT_FOUND') {
          setStatus('not-found');
          socket.disconnect();
        } else {
          setErrorCode(ack.error.code);
          setStatus('error');
        }
      });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('state', receive);
    // Live results for phones that answered (only sent when the presentation shares them).
    socket.on('results', (message) =>
      setState((current) =>
        current?.activeQuestion?.id === message.questionId
          ? { ...current, results: message }
          : current,
      ),
    );
    socket.on('presentation', (info) => {
      setTitle(info.title);
      setTheme(info.theme);
    });
    socket.on('presentation:ended', () => {
      setStatus('ended');
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [joinCode, receive]);

  const submit = useCallback(
    (questionId: string, response: unknown) =>
      new Promise<ResponseSubmitAck>((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected) {
          resolve({ ok: false, error: { code: 'INTERNAL' } });
          return;
        }
        socket
          .timeout(ACK_TIMEOUT_MS)
          .emit('response:submit', { questionId, response }, (error, ack) => {
            if (!error && ack.ok) {
              // The ack carries the new allowance; no state broadcast follows for one participant.
              setState((current) =>
                current?.activeQuestion?.id === questionId
                  ? {
                      ...current,
                      remaining: ack.remaining,
                      // Types shared on phones list this participant's own responses.
                      ...(current.mine ? { mine: [...current.mine, response] } : {}),
                    }
                  : current,
              );
            }
            resolve(error ? { ok: false, error: { code: 'INTERNAL' } } : ack);
          });
      }),
    [],
  );

  const markAnswered = useCallback((questionId: string) => {
    setState((current) =>
      current?.activeQuestion?.id === questionId ? { ...current, remaining: 0 } : current,
    );
  }, []);

  const setNickname = useCallback(
    (nickname: string) =>
      new Promise<NicknameAck>((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected) {
          resolve({ ok: false, error: { code: 'INTERNAL' } });
          return;
        }
        socket.timeout(ACK_TIMEOUT_MS).emit('participant:nickname', { nickname }, (error, ack) => {
          if (!error && ack.ok) {
            setState((current) =>
              current ? { ...current, askNickname: false, nickname: ack.nickname } : current,
            );
          }
          resolve(error ? { ok: false, error: { code: 'INTERNAL' } } : ack);
        });
      }),
    [],
  );

  return {
    status,
    errorCode,
    connected,
    title,
    theme,
    state,
    closesAt,
    submit,
    markAnswered,
    setNickname,
  };
}
