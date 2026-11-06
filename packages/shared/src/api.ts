import { z } from 'zod';
import type { ErrorCode } from './errors';
import { LIMITS } from './limits';
import { QUESTION_TYPE_KEYS, type QuestionTypeKey } from './question-types/registry';
import { textField } from './text';
import { type ThemeKey, themeSchema } from './themes';

const presentationTitle = textField({ min: 1, max: LIMITS.presentationTitle });
const questionTitle = textField({ max: LIMITS.questionTitle, multiline: false });
const entityId = z.string().min(1).max(32);

export const createPresentationBody = z.object({
  title: presentationTitle,
  password: z.string().max(200).optional(),
});
export type CreatePresentationBody = z.infer<typeof createPresentationBody>;

export const updatePresentationBody = z
  .object({
    title: presentationTitle.optional(),
    theme: themeSchema.optional(),
    resultsOnPhones: z.boolean().optional(),
  })
  .refine(
    (body) =>
      body.title !== undefined || body.theme !== undefined || body.resultsOnPhones !== undefined,
    { message: 'Send a title, a theme or resultsOnPhones' },
  );
export type UpdatePresentationBody = z.infer<typeof updatePresentationBody>;

export const createQuestionBody = z.object({
  type: z.enum(QUESTION_TYPE_KEYS as [QuestionTypeKey, ...QuestionTypeKey[]]),
  title: questionTitle.optional(),
  config: z.unknown().optional(),
});
export type CreateQuestionBody = z.infer<typeof createQuestionBody>;

export const updateQuestionBody = z.object({
  title: questionTitle.optional(),
  config: z.unknown().optional(),
  resultsHidden: z.boolean().optional(),
});
export type UpdateQuestionBody = z.infer<typeof updateQuestionBody>;

export const reorderQuestionsBody = z.object({
  ids: z.array(entityId).max(LIMITS.questionsPerPresentation),
});
export type ReorderQuestionsBody = z.infer<typeof reorderQuestionsBody>;

export interface CreatePresentationResult {
  id: string;
  joinCode: string;
  adminToken: string;
}

export interface QuestionDto {
  id: string;
  type: QuestionTypeKey;
  title: string;
  config: unknown;
  position: number;
  responseCount: number;
  /** The presenter screen hides the results until the presenter reveals them. */
  resultsHidden: boolean;
}

export interface PresentationDto {
  id: string;
  title: string;
  theme: ThemeKey;
  /** Phones that answered the active question see its results. */
  resultsOnPhones: boolean;
  joinCode: string;
  activeQuestionId: string | null;
  questions: QuestionDto[];
  createdAt: number;
  updatedAt: number;
}

/** One answer in the export. Participants are numbered 1, 2, 3… by their first answer. */
export interface ResponseExportDto {
  questionId: string;
  participant: number;
  payload: unknown;
  createdAt: number;
  /** The presenter hid this answer from the screen (moderation). */
  hidden: boolean;
}

export interface ResponsesExportDto {
  /** Oldest first. */
  responses: ResponseExportDto[];
}

export interface ServerConfigDto {
  createPasswordRequired: boolean;
  retentionDays: number;
  limits: typeof LIMITS;
}

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string };
}
