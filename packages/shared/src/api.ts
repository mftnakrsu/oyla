import { z } from 'zod';
import type { ErrorCode } from './errors';
import { LIMITS } from './limits';
import { QUESTION_TYPE_KEYS, type QuestionTypeKey } from './question-types/registry';
import { textField } from './text';

const presentationTitle = textField({ min: 1, max: LIMITS.presentationTitle });
const questionTitle = textField({ max: LIMITS.questionTitle, multiline: false });
const entityId = z.string().min(1).max(32);

export const createPresentationBody = z.object({
  title: presentationTitle,
  password: z.string().max(200).optional(),
});
export type CreatePresentationBody = z.infer<typeof createPresentationBody>;

export const updatePresentationBody = z.object({ title: presentationTitle });
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
}

export interface PresentationDto {
  id: string;
  title: string;
  joinCode: string;
  activeQuestionId: string | null;
  questions: QuestionDto[];
  createdAt: number;
  updatedAt: number;
}

export interface ServerConfigDto {
  createPasswordRequired: boolean;
  retentionDays: number;
  limits: typeof LIMITS;
}

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string };
}
