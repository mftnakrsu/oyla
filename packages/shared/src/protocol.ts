import { z } from 'zod';
import type { ErrorCode } from './errors';
import type { QuestionTypeKey } from './question-types/registry';

export type AckError = { ok: false; error: { code: ErrorCode } };
export type Ack<T extends object = object> = ({ ok: true } & T) | AckError;

/** A question as participants see it: the config is passed through toPublicConfig. */
export interface PublicQuestion {
  id: string;
  type: QuestionTypeKey;
  title: string;
  config: unknown;
  /** 0-based position, for "question 2 of 5". */
  index: number;
  total: number;
}

export interface ParticipantState {
  activeQuestion: PublicQuestion | null;
  /** Answers this participant may still give to the active question. */
  remaining: number;
}

export interface ResultsMessage {
  questionId: string;
  results: unknown;
  total: number;
}

const entityId = z.string().min(1).max(32);

export const participantIdSchema = z.string().regex(/^[A-Za-z0-9_-]{16,64}$/);

export const participantJoinSchema = z.object({
  joinCode: z.string().regex(/^\d{6}$/),
  participantId: participantIdSchema,
});

export const responseSubmitSchema = z.object({
  questionId: entityId,
  response: z.unknown(),
});

export const presenterJoinSchema = z.object({
  presentationId: entityId,
  adminToken: z.string().min(1).max(100),
});

export const presenterActivateSchema = z.object({
  questionId: entityId.nullable(),
});

export const presenterResetSchema = z.object({
  questionId: entityId,
});

export type ParticipantJoinAck = Ack<{
  presentationId: string;
  title: string;
  state: ParticipantState;
}>;
export type ResponseSubmitAck = Ack<{ remaining: number }>;
export type PresenterJoinAck = Ack<{
  title: string;
  activeQuestionId: string | null;
  participants: number;
  results: ResultsMessage | null;
}>;

/**
 * Payloads are typed `unknown` on purpose: they come from untrusted clients and every handler
 * parses them with the schemas above.
 */
export interface ClientToServerEvents {
  'participant:join': (payload: unknown, ack: (result: ParticipantJoinAck) => void) => void;
  'response:submit': (payload: unknown, ack: (result: ResponseSubmitAck) => void) => void;
  'presenter:join': (payload: unknown, ack: (result: PresenterJoinAck) => void) => void;
  'presenter:activate': (payload: unknown, ack: (result: Ack) => void) => void;
  'presenter:reset': (payload: unknown, ack: (result: Ack) => void) => void;
}

export interface ServerToClientEvents {
  state: (state: ParticipantState) => void;
  'presenter:state': (state: { activeQuestionId: string | null }) => void;
  results: (message: ResultsMessage) => void;
  presence: (presence: { participants: number }) => void;
  'presentation:ended': () => void;
}
