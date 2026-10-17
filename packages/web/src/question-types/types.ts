import type { ConfigOf, QuestionTypeKey, ResponseOf, ResultsOf } from '@oyla/shared';
import type { ComponentType } from 'react';
import type { MessageKey } from '../i18n/en';

export interface EditorProps<K extends QuestionTypeKey> {
  config: ConfigOf<K>;
  onChange(config: ConfigOf<K>): void;
}

export interface RespondProps<K extends QuestionTypeKey> {
  config: ConfigOf<K>;
  /** Answers the participant may still give. */
  remaining: number;
  /** Resolves true when the server accepted the answer. */
  onSubmit(response: ResponseOf<K>): Promise<boolean>;
}

export interface ResultsProps<K extends QuestionTypeKey> {
  config: ConfigOf<K>;
  results: ResultsOf<K>;
}

export interface QuestionTypeUi<K extends QuestionTypeKey> {
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  Icon: ComponentType<{ className?: string }>;
  Editor: ComponentType<EditorProps<K>>;
  Respond: ComponentType<RespondProps<K>>;
  Results: ComponentType<ResultsProps<K>>;
}

/** A registry entry with its generics erased, for pages that handle every type alike. */
export interface AnyQuestionTypeUi {
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  Icon: ComponentType<{ className?: string }>;
  Editor: ComponentType<{ config: unknown; onChange(config: unknown): void }>;
  Respond: ComponentType<{
    config: unknown;
    remaining: number;
    onSubmit(response: unknown): Promise<boolean>;
  }>;
  Results: ComponentType<{ config: unknown; results: unknown }>;
}
