import {
  type CreatePresentationBody,
  type CreatePresentationResult,
  type CreateQuestionBody,
  DEFAULT_THEME,
  getQuestionType,
  isQuestionTypeKey,
  isScored,
  type Leaderboard,
  LIMITS,
  type ParticipantState,
  type PresentationDto,
  type PresentationInfo,
  publicConfig,
  type QuestionDto,
  type QuestionTypeDefinition,
  type QuestionTypeKey,
  type ResponsesExportDto,
  type ResultsMessage,
  randomId,
  type ScoreSummary,
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

/** Answers still count this long after a timed question closes, for network delay. */
export const CLOSE_GRACE_MS = 1000;

/** Places for a list sorted by points, highest first; ties share a place (1, 1, 3). */
function withRanks<T extends { points: number }>(rows: T[]): (T & { rank: number })[] {
  let rank = 0;
  return rows.map((row, index) => {
    if (index === 0 || row.points !== rows[index - 1]?.points) rank = index + 1;
    return { ...row, rank };
  });
}

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
    const names = nicknameStates(presentationId, participantIds);
    if (!question) {
      for (const id of participantIds) {
        states.set(id, {
          activeQuestion: null,
          remaining: 0,
          results: null,
          ...(names?.get(id) ?? {}),
        });
      }
      return states;
    }
    const type = question.type;
    const shared = type.sharedOnPhones === true;
    // Types with reactions (or that show phones their own answers) need the payloads, not counts.
    const own =
      type.isAnswer || shared
        ? participantIds.length === 1
          ? new Map(
              participantIds.map((id) => [id, store.responses.payloadsOf(question.row.id, id)]),
            )
          : store.responses.payloadsByParticipant(question.row.id)
        : null;
    const used = own
      ? null
      : participantIds.length === 1
        ? new Map(
            participantIds.map((id) => [
              id,
              store.responses.countForParticipant(question.row.id, id),
            ]),
          )
        : store.responses.countsByParticipant(question.row.id);
    const allowed = type.maxResponses(question.config);
    const closesIn = closesInOf(question);
    const closed = closesIn === 0;
    const activeQuestion = {
      id: question.row.id,
      type: question.key,
      title: question.row.title,
      config: publicConfig(question.key, question.config, closed),
      index,
      total: ids.length,
      ...(closesIn === undefined ? {} : { closesIn }),
    };
    const scores = type.score && closed ? scoreSummaries(presentationId, question.row.id) : null;
    // Phones that answered see the results, if the presenter allows it and hasn't hidden them.
    // Types that are shared on phones show them to everyone: people answer by upvoting.
    const share = (presentation.resultsOnPhones || shared) && !question.row.resultsHidden;
    let sharedResults: ResultsMessage | undefined;
    for (const id of participantIds) {
      const mine = own?.get(id) ?? [];
      const count = own ? answersIn(question, mine) : (used?.get(id) ?? 0);
      const sees = share && (shared || count > 0);
      if (sees && !sharedResults) sharedResults = resultsOf(question, question.row.id);
      states.set(id, {
        activeQuestion,
        remaining: Math.max(0, allowed - count),
        results: sees ? (sharedResults ?? null) : null,
        ...(shared ? { mine } : {}),
        ...(scores ? { score: scores(id) } : {}),
        ...(names?.get(id) ?? {}),
      });
    }
    return states;
  }

  /** Milliseconds until a timed question closes (0 once closed); undefined for untimed ones. */
  function closesInOf(question: ResolvedQuestion): number | undefined {
    const limit = question.type.timeLimit?.(question.config);
    if (limit === undefined) return undefined;
    const opened = question.row.openedAt ?? now();
    return Math.max(0, opened + limit * 1000 - now());
  }

  /** How each participant did on a scored question, with their place over the presentation. */
  function scoreSummaries(presentationId: string, questionId: string) {
    const points = store.responses.scoresFor(questionId);
    const ranked = withRanks(store.responses.totals(presentationId));
    const byParticipant = new Map(ranked.map((row) => [row.participantId, row]));
    return (participantId: string): ScoreSummary => {
      const overall = byParticipant.get(participantId);
      return {
        points: points.get(participantId) ?? null,
        total: overall?.points ?? 0,
        rank: overall?.rank ?? null,
        players: ranked.length,
      };
    };
  }

  /** Leaderboard names: who picked one, and whether the presentation needs them at all. */
  function nicknameStates(presentationId: string, participantIds: string[]) {
    const needed = store.questions
      .list(presentationId)
      .some((row) => isQuestionTypeKey(row.type) && isScored(row.type));
    if (!needed) return null;
    const names = new Map(
      store.participants.list(presentationId).map((row) => [row.participantId, row.nickname]),
    );
    return new Map(
      participantIds.map((id) => {
        const nickname = names.get(id) ?? null;
        return [id, { askNickname: nickname === null, nickname }];
      }),
    );
  }

  /** Whether a stored payload is an answer, not a reaction such as an upvote (see `isAnswer`). */
  function isAnswer(question: ResolvedQuestion | null, payload: unknown): boolean {
    const check = question?.type.isAnswer;
    if (!check) return true;
    try {
      return check(payload);
    } catch {
      return true; // an answer of an older shape
    }
  }

  function answersIn(question: ResolvedQuestion | null, payloads: unknown[]): number {
    if (!question?.type.isAnswer) return payloads.length;
    return payloads.filter((payload) => isAnswer(question, payload)).length;
  }

  /** Aggregated results without the answers the presenter hid. */
  function resultsOf(question: ResolvedQuestion | null, questionId: string): ResultsMessage {
    const payloads = store.responses.payloads(questionId);
    const isHidden = question ? hiddenCheck(question) : null;
    const shown = isHidden ? payloads.filter((payload) => !isHidden(payload)) : payloads;
    const total = answersIn(question, shown);
    return {
      questionId,
      results: question
        ? question.type.aggregate(question.config, shown, {
            answeredKeys: new Set(keysOf(question.row.answeredKeys)),
          })
        : null,
      total,
      hidden: answersIn(question, payloads) - total,
    };
  }

  /** Stored moderation keys (hidden or answered); anything malformed counts as none. */
  function keysOf(stored: unknown): string[] {
    return Array.isArray(stored)
      ? stored.filter((key): key is string => typeof key === 'string')
      : [];
  }

  function hiddenKeysOf(row: QuestionRow): string[] {
    return keysOf(row.hiddenKeys);
  }

  /**
   * Whether the presenter hid this answer. Null when nothing is hidden or the type can't be
   * moderated, so callers can skip the check.
   */
  function hiddenCheck(question: ResolvedQuestion): ((payload: unknown) => boolean) | null {
    const keys = new Set(hiddenKeysOf(question.row));
    const keyOf = question.type.moderationKey;
    if (keys.size === 0 || !keyOf) return null;
    return (payload) => {
      try {
        return keys.has(keyOf(payload));
      } catch {
        return false; // an answer of an older shape: leave it visible
      }
    };
  }

  function toQuestionDto(row: QuestionRow, responseCount: number): QuestionDto {
    return {
      id: row.id,
      type: row.type as QuestionTypeKey,
      title: row.title,
      config: row.config,
      position: row.position,
      resultsHidden: row.resultsHidden,
      responseCount,
    };
  }

  function toPresentationDto(row: PresentationRow): PresentationDto {
    const counts = store.responses.countsByPresentation(row.id);
    return {
      id: row.id,
      title: row.title,
      theme: toThemeKey(row.theme),
      resultsOnPhones: row.resultsOnPhones,
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
        resultsOnPhones: false,
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
      // Whether phones see results is part of each participant's state.
      if (changes.resultsOnPhones !== undefined) events.emit('state-changed', presentationId);
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
        resultsHidden: false,
        hiddenKeys: [],
        answeredKeys: [],
        openedAt: null,
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
      const changes: { title?: string; config?: unknown; resultsHidden?: boolean } = {};
      if (body.title !== undefined) {
        changes.title = body.title;
      }
      if (body.resultsHidden !== undefined) {
        changes.resultsHidden = body.resultsHidden;
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
      events.emit('leaderboard-changed', presentationId);
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
      const presentation = requirePresentation(presentationId);
      requireQuestion(presentationId, questionId);
      const time = now();
      store.transaction(() => {
        store.responses.deleteForQuestion(questionId);
        // Starting over: nothing is left to hide or answered, and an open timed question gets
        // its time back.
        store.questions.update(
          presentationId,
          questionId,
          presentation.activeQuestionId === questionId
            ? { hiddenKeys: [], answeredKeys: [], openedAt: time }
            : { hiddenKeys: [], answeredKeys: [] },
          time,
        );
      });
      events.emit('leaderboard-changed', presentationId);
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
      const time = now();
      store.transaction(() => {
        store.presentations.setActiveQuestion(presentationId, questionId, time);
        // Timed questions count down from here, also when the presenter comes back to one.
        if (questionId !== null)
          store.questions.update(presentationId, questionId, { openedAt: time }, time);
      });
      events.emit('state-changed', presentationId);
    },

    activeQuestionId(presentationId: string): string | null {
      return requirePresentation(presentationId).activeQuestionId;
    },

    /** What presenter screens follow: the active question and, if it is timed, its countdown. */
    presenterState(presentationId: string): { activeQuestionId: string | null; closesIn?: number } {
      const activeQuestionId = requirePresentation(presentationId).activeQuestionId;
      const row = activeQuestionId ? store.questions.get(presentationId, activeQuestionId) : null;
      const question = row ? resolve(row) : null;
      const closesIn = question ? closesInOf(question) : undefined;
      return closesIn === undefined ? { activeQuestionId } : { activeQuestionId, closesIn };
    },

    /** The top of the quiz leaderboard; hidden or missing nicknames come back as null. */
    leaderboard(presentationId: string): Leaderboard {
      requirePresentation(presentationId);
      const ranked = withRanks(store.responses.totals(presentationId));
      const people = new Map(
        store.participants.list(presentationId).map((row) => [row.participantId, row]),
      );
      return {
        players: ranked.length,
        entries: ranked.slice(0, LIMITS.leaderboard).map((row) => {
          const person = people.get(row.participantId);
          return {
            id: person?.id ?? 0,
            name: person && !person.nicknameHidden ? person.nickname : null,
            points: row.points,
            rank: row.rank,
          };
        }),
      };
    },

    setNickname(presentationId: string, participantId: string, nickname: string): string {
      requirePresentation(presentationId);
      store.participants.setNickname(presentationId, participantId, nickname, now());
      events.emit('leaderboard-changed', presentationId);
      return nickname;
    },

    /** Moderation: shows this person without a name on the leaderboard. */
    hideNickname(presentationId: string, id: number): void {
      requirePresentation(presentationId);
      if (!store.participants.hideNickname(presentationId, id)) {
        throw new AppError('NOT_FOUND', 404, 'No such participant');
      }
      events.emit('leaderboard-changed', presentationId);
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
          results: null,
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
        const { type } = question;
        let used: number;
        if (type.isAnswer || type.allows) {
          const own = store.responses.payloadsOf(questionId, participantId);
          if (type.allows && !type.allows(parsed.data, own)) {
            throw new AppError('VALIDATION_FAILED', 400, 'This answer is not allowed');
          }
          // An answered Q&A question stops collecting upvotes; asking it again is still fine.
          if (
            type.canMarkAnswered &&
            type.moderationKey &&
            !isAnswer(question, parsed.data) &&
            keysOf(question.row.answeredKeys).includes(type.moderationKey(parsed.data))
          ) {
            throw new AppError('ENTRY_ANSWERED', 409, 'This question was already answered');
          }
          used = answersIn(question, own);
        } else {
          used = store.responses.countForParticipant(questionId, participantId);
        }
        const allowed = type.maxResponses(question.config);
        // Reactions (upvotes) don't use up answers.
        const counts = isAnswer(question, parsed.data);
        if (counts && used >= allowed) {
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
        const limit = type.timeLimit?.(question.config);
        const elapsed = time - (question.row.openedAt ?? time);
        if (limit !== undefined && elapsed > limit * 1000 + CLOSE_GRACE_MS) {
          throw new AppError('QUESTION_CLOSED', 409, 'Time is up');
        }
        // Measured on the server: phones never say how fast they were.
        const score = type.score
          ? type.score(question.config, parsed.data, Math.min(elapsed, (limit ?? 0) * 1000))
          : null;
        store.responses.insert(questionId, participantId, parsed.data, time, score);
        store.presentations.touch(presentationId, time);
        return {
          remaining: Math.max(0, allowed - used - (counts ? 1 : 0)),
          scored: score !== null,
        };
      });
      events.emit('results-changed', presentationId, questionId);
      if (result.scored) events.emit('leaderboard-changed', presentationId);
      return { remaining: result.remaining };
    },

    /**
     * Every answer for the CSV export. Participant ids become 1, 2, 3…: the id is what lets a
     * phone back into its answers, so it never leaves the server.
     */
    exportResponses(presentationId: string): ResponsesExportDto {
      requirePresentation(presentationId);
      const numbers = new Map<string, number>();
      const rows = store.responses.listForPresentation(presentationId);
      const checks = new Map<string, ((payload: unknown) => boolean) | null>();
      for (const row of store.questions.list(presentationId)) {
        const question = resolve(row);
        checks.set(row.id, question ? hiddenCheck(question) : null);
      }
      const names = new Map(
        store.participants
          .list(presentationId)
          .map((row) => [row.participantId, row.nicknameHidden ? null : row.nickname]),
      );
      return {
        responses: rows.map((row) => {
          let participant = numbers.get(row.participantId);
          if (participant === undefined) {
            participant = numbers.size + 1;
            numbers.set(row.participantId, participant);
          }
          return {
            questionId: row.questionId,
            participant,
            name: names.get(row.participantId) ?? null,
            payload: row.payload,
            score: row.score,
            createdAt: row.createdAt,
            hidden: checks.get(row.questionId)?.(row.payload) ?? false,
          };
        }),
      };
    },

    results(presentationId: string, questionId: string): ResultsMessage {
      return resultsOf(resolve(requireQuestion(presentationId, questionId)), questionId);
    },

    /**
     * Participants whose phones should get live results for this question: those who answered
     * it, while it is active, its results aren't hidden and the presentation shares results.
     * 'everyone' for types shared on phones (Q&A). Null when no phone should get them.
     */
    resultsAudience(presentationId: string, questionId: string): Set<string> | 'everyone' | null {
      const presentation = requirePresentation(presentationId);
      if (presentation.activeQuestionId !== questionId) return null;
      const row = store.questions.get(presentationId, questionId);
      if (!row || row.resultsHidden) return null;
      if (isQuestionTypeKey(row.type) && getQuestionType(row.type).sharedOnPhones)
        return 'everyone';
      if (!presentation.resultsOnPhones) return null;
      return new Set(store.responses.countsByParticipant(questionId).keys());
    },

    /** Moderation: hides every answer with this key, including ones sent later. */
    hideEntry(presentationId: string, questionId: string, key: string): void {
      requirePresentation(presentationId);
      const question = resolve(requireQuestion(presentationId, questionId));
      if (!question?.type.moderationKey) {
        throw new AppError('VALIDATION_FAILED', 400, 'Answers to this question cannot be hidden');
      }
      const keys = hiddenKeysOf(question.row);
      if (keys.includes(key)) return;
      if (keys.length >= LIMITS.hiddenEntries) {
        throw new AppError('VALIDATION_FAILED', 400, 'Too many hidden answers');
      }
      const time = now();
      store.questions.update(presentationId, questionId, { hiddenKeys: [...keys, key] }, time);
      store.presentations.touch(presentationId, time);
      events.emit('results-changed', presentationId, questionId);
    },

    /** Moderation: marks the answers with this key as answered (Q&A), or takes the mark off. */
    markAnswered(presentationId: string, questionId: string, key: string, answered: boolean): void {
      requirePresentation(presentationId);
      const question = resolve(requireQuestion(presentationId, questionId));
      if (!question?.type.canMarkAnswered) {
        throw new AppError('VALIDATION_FAILED', 400, 'Answers to this question cannot be marked');
      }
      const keys = keysOf(question.row.answeredKeys);
      if (keys.includes(key) === answered) return;
      if (answered && keys.length >= LIMITS.hiddenEntries) {
        throw new AppError('VALIDATION_FAILED', 400, 'Too many answered questions');
      }
      const time = now();
      store.questions.update(
        presentationId,
        questionId,
        { answeredKeys: answered ? [...keys, key] : keys.filter((other) => other !== key) },
        time,
      );
      store.presentations.touch(presentationId, time);
      events.emit('results-changed', presentationId, questionId);
    },

    /** Moderation: brings back every hidden answer of a question. */
    showHidden(presentationId: string, questionId: string): void {
      requirePresentation(presentationId);
      requireQuestion(presentationId, questionId);
      const time = now();
      store.questions.update(presentationId, questionId, { hiddenKeys: [] }, time);
      store.presentations.touch(presentationId, time);
      events.emit('results-changed', presentationId, questionId);
    },
  };
}
