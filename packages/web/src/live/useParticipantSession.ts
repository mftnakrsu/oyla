import type { ErrorCode, ParticipantState, ResponseSubmitAck } from '@oyla/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getParticipantId } from '../lib/participant';
import { createSocket, type OylaSocket } from './socket';

export type ParticipantStatus = 'connecting' | 'ready' | 'not-found' | 'ended' | 'error';

export interface ParticipantSession {
  status: ParticipantStatus;
  errorCode: ErrorCode | null;
  connected: boolean;
  title: string;
  state: ParticipantState | null;
  submit(questionId: string, response: unknown): Promise<ResponseSubmitAck>;
}

const ACK_TIMEOUT_MS = 10_000;

/** Joins a presentation by code and re-joins after every reconnect; the server owns the state. */
export function useParticipantSession(joinCode: string): ParticipantSession {
  const socketRef = useRef<OylaSocket | null>(null);
  const [status, setStatus] = useState<ParticipantStatus>('connecting');
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [connected, setConnected] = useState(false);
  const [title, setTitle] = useState('');
  const [state, setState] = useState<ParticipantState | null>(null);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;
    const participantId = getParticipantId();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('participant:join', { joinCode, participantId }, (ack) => {
        if (ack.ok) {
          setTitle(ack.title);
          setState(ack.state);
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
    socket.on('state', setState);
    socket.on('presentation:ended', () => {
      setStatus('ended');
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [joinCode]);

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
                  ? { ...current, remaining: ack.remaining }
                  : current,
              );
            }
            resolve(error ? { ok: false, error: { code: 'INTERNAL' } } : ack);
          });
      }),
    [],
  );

  return { status, errorCode, connected, title, state, submit };
}
