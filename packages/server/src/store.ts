import { and, asc, count, eq, lt, sql } from 'drizzle-orm';
import type { DatabaseHandle } from './db/client';
import {
  type PresentationRow,
  presentations,
  type QuestionRow,
  questions,
  responses,
} from './db/schema';

export type Store = ReturnType<typeof createStore>;

/** Every SQL statement Oyla runs. better-sqlite3 is synchronous, so all methods are too. */
export function createStore({ db, sqlite }: DatabaseHandle) {
  return {
    /** Runs fn atomically; statements inside it join the transaction through the shared connection. */
    transaction<T>(fn: () => T): T {
      return sqlite.transaction(fn)();
    },

    presentations: {
      insert(row: PresentationRow): void {
        db.insert(presentations).values(row).run();
      },
      get(id: string): PresentationRow | undefined {
        return db.select().from(presentations).where(eq(presentations.id, id)).get();
      },
      getByJoinCode(joinCode: string): PresentationRow | undefined {
        return db.select().from(presentations).where(eq(presentations.joinCode, joinCode)).get();
      },
      joinCodeExists(joinCode: string): boolean {
        return (
          db
            .select({ id: presentations.id })
            .from(presentations)
            .where(eq(presentations.joinCode, joinCode))
            .get() !== undefined
        );
      },
      updateTitle(id: string, title: string, now: number): void {
        db.update(presentations)
          .set({ title, updatedAt: now, lastActivityAt: now })
          .where(eq(presentations.id, id))
          .run();
      },
      setActiveQuestion(id: string, questionId: string | null, now: number): void {
        db.update(presentations)
          .set({ activeQuestionId: questionId, updatedAt: now, lastActivityAt: now })
          .where(eq(presentations.id, id))
          .run();
      },
      touch(id: string, now: number): void {
        db.update(presentations).set({ lastActivityAt: now }).where(eq(presentations.id, id)).run();
      },
      delete(id: string): void {
        db.delete(presentations).where(eq(presentations.id, id)).run();
      },
      idleIds(before: number): string[] {
        return db
          .select({ id: presentations.id })
          .from(presentations)
          .where(lt(presentations.lastActivityAt, before))
          .all()
          .map((row) => row.id);
      },
    },

    questions: {
      list(presentationId: string): QuestionRow[] {
        return db
          .select()
          .from(questions)
          .where(eq(questions.presentationId, presentationId))
          .orderBy(asc(questions.position))
          .all();
      },
      get(presentationId: string, questionId: string): QuestionRow | undefined {
        return db
          .select()
          .from(questions)
          .where(and(eq(questions.presentationId, presentationId), eq(questions.id, questionId)))
          .get();
      },
      count(presentationId: string): number {
        const row = db
          .select({ value: count() })
          .from(questions)
          .where(eq(questions.presentationId, presentationId))
          .get();
        return row?.value ?? 0;
      },
      /** Question ids in presentation order, without loading configs. */
      ids(presentationId: string): string[] {
        return db
          .select({ id: questions.id })
          .from(questions)
          .where(eq(questions.presentationId, presentationId))
          .orderBy(asc(questions.position))
          .all()
          .map((row) => row.id);
      },
      nextPosition(presentationId: string): number {
        const row = db
          .select({ value: sql<number | null>`max(${questions.position})` })
          .from(questions)
          .where(eq(questions.presentationId, presentationId))
          .get();
        return row?.value == null ? 0 : row.value + 1;
      },
      insert(row: QuestionRow): QuestionRow {
        db.insert(questions).values(row).run();
        return row;
      },
      update(
        presentationId: string,
        questionId: string,
        changes: { title?: string; config?: unknown },
        now: number,
      ): void {
        db.update(questions)
          .set({ ...changes, updatedAt: now })
          .where(and(eq(questions.presentationId, presentationId), eq(questions.id, questionId)))
          .run();
      },
      delete(presentationId: string, questionId: string): void {
        sqlite.transaction(() => {
          db.delete(questions)
            .where(and(eq(questions.presentationId, presentationId), eq(questions.id, questionId)))
            .run();
          const remaining = db
            .select({ id: questions.id })
            .from(questions)
            .where(eq(questions.presentationId, presentationId))
            .orderBy(asc(questions.position))
            .all();
          remaining.forEach((row, position) => {
            db.update(questions).set({ position }).where(eq(questions.id, row.id)).run();
          });
        })();
      },
      reorder(presentationId: string, ids: string[], now: number): void {
        sqlite.transaction(() => {
          ids.forEach((id, position) => {
            db.update(questions)
              .set({ position, updatedAt: now })
              .where(and(eq(questions.presentationId, presentationId), eq(questions.id, id)))
              .run();
          });
        })();
      },
    },

    responses: {
      /** Payloads of one question, oldest first. */
      payloads(questionId: string): unknown[] {
        return db
          .select({ payload: responses.payload })
          .from(responses)
          .where(eq(responses.questionId, questionId))
          .orderBy(asc(responses.id))
          .all()
          .map((row) => row.payload);
      },
      countForQuestion(questionId: string): number {
        const row = db
          .select({ value: count() })
          .from(responses)
          .where(eq(responses.questionId, questionId))
          .get();
        return row?.value ?? 0;
      },
      countForParticipant(questionId: string, participantId: string): number {
        const row = db
          .select({ value: count() })
          .from(responses)
          .where(
            and(eq(responses.questionId, questionId), eq(responses.participantId, participantId)),
          )
          .get();
        return row?.value ?? 0;
      },
      /** Answers per participant for one question, in one query. */
      countsByParticipant(questionId: string): Map<string, number> {
        const rows = db
          .select({ participantId: responses.participantId, value: count() })
          .from(responses)
          .where(eq(responses.questionId, questionId))
          .groupBy(responses.participantId)
          .all();
        return new Map(rows.map((row) => [row.participantId, row.value]));
      },
      countForPresentation(presentationId: string): number {
        const row = db
          .select({ value: count() })
          .from(responses)
          .innerJoin(questions, eq(questions.id, responses.questionId))
          .where(eq(questions.presentationId, presentationId))
          .get();
        return row?.value ?? 0;
      },
      insert(questionId: string, participantId: string, payload: unknown, now: number): void {
        db.insert(responses).values({ questionId, participantId, payload, createdAt: now }).run();
      },
      deleteForQuestion(questionId: string): void {
        db.delete(responses).where(eq(responses.questionId, questionId)).run();
      },
      countsByPresentation(presentationId: string): Map<string, number> {
        const rows = db
          .select({ questionId: responses.questionId, value: count() })
          .from(responses)
          .innerJoin(questions, eq(questions.id, responses.questionId))
          .where(eq(questions.presentationId, presentationId))
          .groupBy(responses.questionId)
          .all();
        return new Map(rows.map((row) => [row.questionId, row.value]));
      },
    },
  };
}
