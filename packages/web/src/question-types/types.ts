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
  /**
   * Types that are `sharedOnPhones` only: the live results (null while the presenter hides
   * them) and this participant's earlier responses.
   */
  results?: ResultsOf<K> | null;
  mine?: ResponseOf<K>[];
}

export interface ResultsProps<K extends QuestionTypeKey> {
  config: ConfigOf<K>;
  results: ResultsOf<K>;
  /**
   * Set while the presenter moderates: show a hide button per answer and call this with the
   * answer's moderation key (see `moderationKeyOf`). Only types with a `moderationKey` get it.
   */
  onHide?(key: string): void;
  /** Timed types: the time is up, so the correct answer may be shown. */
  revealed?: boolean;
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
    results?: unknown;
    mine?: unknown[];
  }>;
  Results: ComponentType<{
    config: unknown;
    results: unknown;
    onHide?(key: string): void;
    revealed?: boolean;
  }>;
}
