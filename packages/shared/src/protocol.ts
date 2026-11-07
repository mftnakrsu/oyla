import { z } from 'zod';
import type { ErrorCode } from './errors';
import { LIMITS } from './limits';
import type { QuestionTypeKey } from './question-types/registry';
import type { ThemeKey } from './themes';

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
  /**
   * Live results of the active question, once this participant answered it and only when the
   * presentation shares results with phones and they aren't hidden. Null otherwise. Types that
   * are `sharedOnPhones` get them on every phone, answered or not, unless they are hidden.
   */
  results: ResultsMessage | null;
  /**
   * This participant's earlier responses to the active question, oldest first. Only for types
   * that are `sharedOnPhones` (Q&A: which questions they asked and upvoted).
   */
  mine?: unknown[];
}

/** What every screen of a presentation shows around the questions. */
export interface PresentationInfo {
  title: string;
  theme: ThemeKey;
}

export interface ResultsMessage {
  questionId: string;
  results: unknown;
  /** Answers counted in `results`. */
  total: number;
  /** Answers the presenter hid (moderation); not part of `results` or `total`. */
  hidden: number;
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

export const presenterHideEntrySchema = z.object({
  questionId: entityId,
  key: z.string().min(1).max(LIMITS.hiddenKey),
});

export const presenterShowHiddenSchema = z.object({
  questionId: entityId,
});

export type ParticipantJoinAck = Ack<{
  presentationId: string;
  title: string;
  theme: ThemeKey;
  state: ParticipantState;
}>;
export type ResponseSubmitAck = Ack<{ remaining: number }>;
export type PresenterJoinAck = Ack<{
  title: string;
  theme: ThemeKey;
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
  /** Hides every answer with this moderation key from the results. */
  'presenter:hide-entry': (payload: unknown, ack: (result: Ack) => void) => void;
  /** Brings back every hidden answer of a question. */
  'presenter:show-hidden': (payload: unknown, ack: (result: Ack) => void) => void;
}

export interface ServerToClientEvents {
  state: (state: ParticipantState) => void;
  'presenter:state': (state: { activeQuestionId: string | null }) => void;
  results: (message: ResultsMessage) => void;
  presence: (presence: { participants: number }) => void;
  /** The title or theme changed; sent to participants and presenters. */
  presentation: (info: PresentationInfo) => void;
  'presentation:ended': () => void;
}
