import {
  type CreatePresentationBody,
  type CreatePresentationResult,
  type CreateQuestionBody,
  type ErrorCode,
  isErrorCode,
  type PresentationDto,
  type QuestionDto,
  type ServerConfigDto,
  type UpdateQuestionBody,
} from '@oyla/shared';

/** A failed API call. `code` is a server error code or NETWORK when the server was unreachable. */
export class ApiRequestError extends Error {
  constructor(
    readonly code: ErrorCode | 'NETWORK',
    readonly status: number,
  ) {
    super(code);
    this.name = 'ApiRequestError';
  }
}

async function request<T>(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiRequestError('NETWORK', 0);
  }
  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = (data as { error?: { code?: unknown } } | null)?.error?.code;
    throw new ApiRequestError(isErrorCode(code) ? code : 'INTERNAL', response.status);
  }
  return data as T;
}

const enc = encodeURIComponent;

export const api = {
  config: () => request<ServerConfigDto>('GET', '/config'),
  createPresentation: (body: CreatePresentationBody) =>
    request<CreatePresentationResult>('POST', '/presentations', { body }),
  getPresentation: (id: string, token: string) =>
    request<PresentationDto>('GET', `/presentations/${enc(id)}`, { token }),
  renamePresentation: (id: string, token: string, title: string) =>
    request<PresentationDto>('PATCH', `/presentations/${enc(id)}`, { token, body: { title } }),
  deletePresentation: (id: string, token: string) =>
    request<void>('DELETE', `/presentations/${enc(id)}`, { token }),
  addQuestion: (id: string, token: string, body: CreateQuestionBody) =>
    request<QuestionDto>('POST', `/presentations/${enc(id)}/questions`, { token, body }),
  updateQuestion: (id: string, token: string, questionId: string, body: UpdateQuestionBody) =>
    request<QuestionDto>('PATCH', `/presentations/${enc(id)}/questions/${enc(questionId)}`, {
      token,
      body,
    }),
  deleteQuestion: (id: string, token: string, questionId: string) =>
    request<void>('DELETE', `/presentations/${enc(id)}/questions/${enc(questionId)}`, { token }),
  reorderQuestions: (id: string, token: string, ids: string[]) =>
    request<PresentationDto>('PUT', `/presentations/${enc(id)}/questions/order`, {
      token,
      body: { ids },
    }),
  resetResults: (id: string, token: string, questionId: string) =>
    request<void>('DELETE', `/presentations/${enc(id)}/questions/${enc(questionId)}/responses`, {
      token,
    }),
};

export function errorCodeOf(error: unknown): ErrorCode | 'NETWORK' {
  return error instanceof ApiRequestError ? error.code : 'INTERNAL';
}
