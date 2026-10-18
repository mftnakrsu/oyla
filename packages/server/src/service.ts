import {
  type CreatePresentationBody,
  type CreatePresentationResult,
  type CreateQuestionBody,
  DEFAULT_THEME,
  getQuestionType,
  isQuestionTypeKey,
  LIMITS,
  type ParticipantState,
  type PresentationDto,
  type PresentationInfo,
  publicConfig,
  type QuestionDto,
  type QuestionTypeDefinition,
  type QuestionTypeKey,
  type ResultsMessage,
  randomId,
  toThemeKey,
  type UpdatePresentationBody,
  type UpdateQuestionBody,
} from '@oyla/shared';
import { AppError } from './app-error';
import { generateAdminToken, hashToken, passwordMatches, verifyToken } from './auth';
import type { AppConfig } from './config';
import type { PresentationRow, QuestionRow } from './db/schema';
import type { LiveEvents } from './events';
import { generateJoinCode } from './join-codes';
import type { Store } from './store';

type AnyQuestionType = QuestionTypeDefinition<unknown, unknown, unknown>;

interface ResolvedQuestion {
  row: QuestionRow;
  key: QuestionTypeKey;
  type: AnyQuestionType;
  config: unknown;
}

export interface ServiceDeps {
  store: Store;
  events: LiveEvents;
  config: AppConfig;
  now?: () => number;
}

export type PresentationService = ReturnType<typeof createPresentationService>;

/** Business rules shared by the REST API and the live layer. */
export function createPresentationService({ store, events, config, now = Date.now }: ServiceDeps) {
  function requirePresentation(presentationId: string): PresentationRow {
    const row = store.presentations.get(presentationId);
    if (!row) {
      throw new AppError('NOT_FOUND', 404, 'Presentation not found');
    }
    return row;
  }

  function requireQuestion(presentationId: string, questionId: string): QuestionRow {
    const row = store.questions.get(presentationId, questionId);
    if (!row) {
      throw new AppError('NOT_FOUND', 404, 'Question not found');
    }
    return row;
  }

  function parseConfig(type: AnyQuestionType, config: unknown): unknown {
    const parsed = type.configSchema.safeParse(config);
    if (!parsed.success) {
      throw new AppError('VALIDATION_FAILED', 400, 'Invalid question settings');
    }
    return parsed.data;
  }

  /**
   * The question with its parsed config, or null when the type is unknown or the stored config no
   * longer parses (e.g. after a schema change). Such a question is shown as unavailable rather
   * than with invented settings.
   */
  function resolve(row: QuestionRow): ResolvedQuestion | null {
    if (!isQuestionTypeKey(row.type)) {
      return null;
    }
    const type = getQuestionType(row.type);
    const parsed = type.configSchema.safeParse(row.config);
    return parsed.success ? { row, key: row.type, type, config: parsed.data } : null;
  }

  /** Every participant's view of the active question, with one query for all answer counts. */
  function participantStates(
    presentationId: string,
    participantIds: string[],
  ): Map<string, ParticipantState> {
    const presentation = requirePresentation(presentationId);
    const states = new Map<string, ParticipantState>();
    const activeId = presentation.activeQuestionId;
    const ids = activeId ? store.questions.ids(presentationId) : [];
    const index = activeId ? ids.indexOf(activeId) : -1;
    const row = activeId && index >= 0 ? store.questions.get(presentationId, activeId) : undefined;
    const question = row ? resolve(row) : null;
    if (!question) {
      for (const id of participantIds) states.set(id, { activeQuestion: null, remaining: 0 });
      return states;
    }
    const used =
      participantIds.length === 1
        ? new Map(
            participantIds.map((id) => [
              id,
              store.responses.countForParticipant(question.row.id, id),
            ]),
          )
        : store.responses.countsByParticipant(question.row.id);
    const allowed = question.type.maxResponses(question.config);
    const activeQuestion = {
      id: question.row.id,
      type: question.key,
      title: question.row.title,
      config: publicConfig(question.key, question.config),
      index,
      total: ids.length,
    };
    for (const id of participantIds) {
      states.set(id, { activeQuestion, remaining: Math.max(0, allowed - (used.get(id) ?? 0)) });
    }
    return states;
  }

  function toQuestionDto(row: QuestionRow, responseCount: number): QuestionDto {
    return {
      id: row.id,
      type: row.type as QuestionTypeKey,
      title: row.title,
      config: row.config,
      position: row.position,
      responseCount,
    };
  }

  function toPresentationDto(row: PresentationRow): PresentationDto {
    const counts = store.responses.countsByPresentation(row.id);
    return {
      id: row.id,
      title: row.title,
      theme: toThemeKey(row.theme),
      joinCode: row.joinCode,
      activeQuestionId: row.activeQuestionId,
      questions: store.questions.list(row.id).map((q) => toQuestionDto(q, counts.get(q.id) ?? 0)),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  return {
    create(input: CreatePresentationBody): CreatePresentationResult {
      if (config.createPassword !== null) {
        if (!input.password) {
          throw new AppError('CREATE_PASSWORD_REQUIRED', 401, 'This server needs a password');
        }
        if (!passwordMatches(input.password, config.createPassword)) {
          throw new AppError('CREATE_PASSWORD_INVALID', 403, 'Wrong password');
        }
      }
      const adminToken = generateAdminToken();
      const id = randomId(12);
      const joinCode = generateJoinCode((code) => store.presentations.joinCodeExists(code));
      const time = now();
      store.presentations.insert({
        id,
        joinCode,
        title: input.title,
        theme: DEFAULT_THEME,
        adminTokenHash: hashToken(adminToken),
        activeQuestionId: null,
        createdAt: time,
        updatedAt: time,
        lastActivityAt: time,
      });
      return { id, joinCode, adminToken };
    },

    authenticate(presentationId: string, adminToken: string): PresentationRow {
      const row = requirePresentation(presentationId);
      if (!verifyToken(adminToken, row.adminTokenHash)) {
        throw new AppError('UNAUTHORIZED', 401, 'Invalid admin link');
      }
      return row;
    },

    get(presentationId: string): PresentationDto {
      const row = requirePresentation(presentationId);
      store.presentations.touch(presentationId, now());
      return toPresentationDto(row);
    },

    update(presentationId: string, changes: UpdatePresentationBody): PresentationDto {
      requirePresentation(presentationId);
      store.presentations.update(presentationId, changes, now());
      events.emit('presentation-changed', presentationId);
      return toPresentationDto(requirePresentation(presentationId));
    },

    /** Title and theme, for the live layer. */
    info(presentationId: string): PresentationInfo {
      const row = requirePresentation(presentationId);
      return { title: row.title, theme: toThemeKey(row.theme) };
    },

    remove(presentationId: string): void {
      requirePresentation(presentationId);
      store.presentations.delete(presentationId);
      events.emit('presentation-ended', presentationId);
    },

    addQuestion(presentationId: string, body: CreateQuestionBody): QuestionDto {
      requirePresentation(presentationId);
      if (store.questions.count(presentationId) >= LIMITS.questionsPerPresentation) {
        throw new AppError('QUESTION_LIMIT_REACHED', 409, 'Too many questions');
      }
      const type = getQuestionType(body.type);
      const time = now();
      const row = store.questions.insert({
        id: randomId(12),
        presentationId,
        position: store.questions.nextPosition(presentationId),
        type: body.type,
        title: body.title ?? '',
        config: body.config === undefined ? type.defaultConfig() : parseConfig(type, body.config),
        createdAt: time,
        updatedAt: time,
      });
      store.presentations.touch(presentationId, time);
      // "Question 2 of N" changes for whoever watches the active question.
      events.emit('state-changed', presentationId);
      return toQuestionDto(row, 0);
    },

    updateQuestion(
      presentationId: string,
      questionId: string,
      body: UpdateQuestionBody,
    ): QuestionDto {
      const presentation = requirePresentation(presentationId);
      const row = requireQuestion(presentationId, questionId);
      const changes: { title?: string; config?: unknown } = {};
      if (body.title !== undefined) {
        changes.title = body.title;
      }
      if (body.config !== undefined) {
        if (!isQuestionTypeKey(row.type)) {
          throw new AppError('VALIDATION_FAILED', 400, 'Unknown question type');
        }
        changes.config = parseConfig(getQuestionType(row.type), body.config);
      }
      const time = now();
      store.questions.update(presentationId, questionId, changes, time);
      store.presentations.touch(presentationId, time);
      if (presentation.activeQuestionId === questionId) {
        events.emit('state-changed', presentationId);
        events.emit('results-changed', presentationId, questionId);
      }
      return toQuestionDto(
        requireQuestion(presentationId, questionId),
        store.responses.countForQuestion(questionId),
      );
    },

    deleteQuestion(presentationId: string, questionId: string): void {
      const presentation = requirePresentation(presentationId);
      requireQuestion(presentationId, questionId);
      const time = now();
      store.transaction(() => {
        if (presentation.activeQuestionId === questionId) {
          store.presentations.setActiveQuestion(presentationId, null, time);
        }
        store.questions.delete(presentationId, questionId);
      });
      events.emit('state-changed', presentationId);
    },

    reorder(presentationId: string, ids: string[]): PresentationDto {
      requirePresentation(presentationId);
      const current = new Set(store.questions.list(presentationId).map((q) => q.id));
      const isPermutation =
        ids.length === current.size &&
        new Set(ids).size === ids.length &&
        ids.every((id) => current.has(id));
      if (!isPermutation) {
        throw new AppError('VALIDATION_FAILED', 400, 'The order must list every question once');
      }
      store.questions.reorder(presentationId, ids, now());
      events.emit('state-changed', presentationId);
      return toPresentationDto(requirePresentation(presentationId));
    },

    resetResults(presentationId: string, questionId: string): void {
      requirePresentation(presentationId);
      requireQuestion(presentationId, questionId);
      store.responses.deleteForQuestion(questionId);
      store.presentations.touch(presentationId, now());
      events.emit('responses-cleared', presentationId, questionId);
      events.emit('results-changed', presentationId, questionId);
      events.emit('state-changed', presentationId);
    },

    activate(presentationId: string, questionId: string | null): void {
      requirePresentation(presentationId);
      if (questionId !== null) {
        requireQuestion(presentationId, questionId);
      }
      store.presentations.setActiveQuestion(presentationId, questionId, now());
      events.emit('state-changed', presentationId);
    },

    activeQuestionId(presentationId: string): string | null {
      return requirePresentation(presentationId).activeQuestionId;
    },

    joinByCode(joinCode: string): PresentationRow {
      const row = store.presentations.getByJoinCode(joinCode);
      if (!row) {
        throw new AppError('JOIN_CODE_NOT_FOUND', 404, 'No presentation with this code');
      }
      // No touch: guessing codes must not keep presentations alive. Answers and edits do.
      return row;
    },

    participantStates,

    participantState(presentationId: string, participantId: string): ParticipantState {
      return (
        participantStates(presentationId, [participantId]).get(participantId) ?? {
          activeQuestion: null,
          remaining: 0,
        }
      );
    },

    submit(
      presentationId: string,
      participantId: string,
      questionId: string,
      response: unknown,
    ): { remaining: number } {
      const result = store.transaction(() => {
        const presentation = requirePresentation(presentationId);
        if (presentation.activeQuestionId !== questionId) {
          throw new AppError('QUESTION_NOT_ACTIVE', 409, 'This question is not open');
        }
        const question = resolve(requireQuestion(presentationId, questionId));
        if (!question) {
          throw new AppError('VALIDATION_FAILED', 400, 'This question cannot take answers');
        }
        const parsed = question.type.responseSchema(question.config).safeParse(response);
        if (!parsed.success) {
          throw new AppError('VALIDATION_FAILED', 400, 'Invalid answer');
        }
        const used = store.responses.countForParticipant(questionId, participantId);
        const allowed = question.type.maxResponses(question.config);
        if (used >= allowed) {
          throw new AppError('RESPONSE_LIMIT_REACHED', 409, 'No answers left');
        }
        if (store.responses.countForQuestion(questionId) >= LIMITS.responsesPerQuestion) {
          throw new AppError('QUESTION_FULL', 409, 'This question has too many answers');
        }
        if (
          store.responses.countForPresentation(presentationId) >= LIMITS.responsesPerPresentation
        ) {
          throw new AppError('PRESENTATION_FULL', 409, 'This presentation has too many answers');
        }
        const time = now();
        store.responses.insert(questionId, participantId, parsed.data, time);
        store.presentations.touch(presentationId, time);
        return { remaining: allowed - used - 1 };
      });
      events.emit('results-changed', presentationId, questionId);
      return result;
    },

    results(presentationId: string, questionId: string): ResultsMessage {
      const question = resolve(requireQuestion(presentationId, questionId));
      const payloads = store.responses.payloads(questionId);
      return {
        questionId,
        results: question ? question.type.aggregate(question.config, payloads) : null,
        total: payloads.length,
      };
    },
  };
}
