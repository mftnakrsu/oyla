import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const presentations = sqliteTable(
  'presentations',
  {
    id: text('id').primaryKey(),
    joinCode: text('join_code').notNull().unique(),
    title: text('title').notNull(),
    theme: text('theme').notNull().default('emerald'),
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
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    index('responses_question_participant_idx').on(table.questionId, table.participantId),
  ],
);

export type PresentationRow = typeof presentations.$inferSelect;
export type QuestionRow = typeof questions.$inferSelect;
