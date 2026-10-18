import type { Ack, ErrorCode, ResultsMessage } from '@oyla/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createSocket, type OylaSocket } from './socket';

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
  activeQuestionId: string | null;
  /** Increases on every state broadcast, i.e. whenever questions or the active one changed. */
  stateVersion: number;
  participants: number;
  /** Latest results per question id. */
  results: Record<string, ResultsMessage>;
  activate(questionId: string | null): Promise<Ack>;
  reset(questionId: string): Promise<Ack>;
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
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
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
          setActiveQuestionId(ack.activeQuestionId);
          setParticipants(ack.participants);
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
      setStateVersion((version) => version + 1);
    });
    socket.on('results', keep);
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
    (event: 'presenter:activate' | 'presenter:reset', payload: object) =>
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

  return {
    status,
    errorCode,
    connected,
    activeQuestionId,
    stateVersion,
    participants,
    results,
    activate,
    reset,
  };
}
