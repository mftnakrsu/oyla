import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const presentations = sqliteTable(
  'presentations',
  {
    id: text('id').primaryKey(),
    joinCode: text('join_code').notNull().unique(),
    title: text('title').notNull(),
    theme: text('theme').notNull().default('emerald'),
    /** Phones that answered the active question see its results. */
    resultsOnPhones: integer('results_on_phones', { mode: 'boolean' }).notNull().default(false),
    adminTokenHash: text('admin_token_hash').notNull(),
    activeQuestionId: text('active_question_id'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    lastActivityAt: integer('last_activity_at').notNull(),
  },
  (table) => [index('presentations_last_activity_idx').on(table.lastActivityAt)],
);

export const questions = sqliteTable(
  'questions',
  {
    id: text('id').primaryKey(),
    presentationId: text('presentation_id')
      .notNull()
      .references(() => presentations.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    config: text('config', { mode: 'json' }).$type<unknown>().notNull(),
    /** The presenter screen shows a "results are hidden" card until the presenter reveals them. */
    resultsHidden: integer('results_hidden', { mode: 'boolean' }).notNull().default(false),
    /** Moderation keys of answers the presenter hid from the results. */
    hiddenKeys: text('hidden_keys', { mode: 'json' }).$type<string[]>().notNull().default([]),
    /** When the question was last made active; timed questions (quiz) count down from it. */
    openedAt: integer('opened_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [index('questions_presentation_idx').on(table.presentationId, table.position)],
);

export const responses = sqliteTable(
  'responses',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    participantId: text('participant_id').notNull(),
    payload: text('payload', { mode: 'json' }).$type<unknown>().notNull(),
    /** Points the server gave this answer (quiz). Null for types without scoring. */
    score: integer('score'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    index('responses_question_participant_idx').on(table.questionId, table.participantId),
  ],
);

/** Nicknames for the quiz leaderboard. Only exists for participants who picked one. */
export const participants = sqliteTable(
  'participants',
  {
    /** Shown to the presenter instead of the participant id, which must stay secret. */
    id: integer('id').primaryKey({ autoIncrement: true }),
    presentationId: text('presentation_id')
      .notNull()
      .references(() => presentations.id, { onDelete: 'cascade' }),
    participantId: text('participant_id').notNull(),
    nickname: text('nickname').notNull(),
    /** The presenter took the nickname off the leaderboard (moderation). */
    nicknameHidden: integer('nickname_hidden', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('participants_presentation_participant_idx').on(
      table.presentationId,
      table.participantId,
    ),
  ],
);

export type PresentationRow = typeof presentations.$inferSelect;
export type QuestionRow = typeof questions.$inferSelect;
export type ParticipantRow = typeof participants.$inferSelect;
