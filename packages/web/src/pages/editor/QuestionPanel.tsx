import {
  getQuestionType,
  LIMITS,
  type QuestionDto,
  type QuestionTypeKey,
  type UpdateQuestionBody,
} from '@oyla/shared';
import {
  forwardRef,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { api, errorCodeOf } from '../../api/client';
import { Button } from '../../components/Button';
import { ConfirmButton } from '../../components/ConfirmButton';
import { useI18n } from '../../i18n/I18nProvider';
import { getQuestionTypeUi } from '../../question-types/registry';
import { inputClass } from '../../question-types/shared';

const SAVE_DELAY_MS = 500;

export interface QuestionPanelHandle {
  /** Saves pending edits right away (before presenting). */
  flush(): Promise<void>;
}

interface QuestionPanelProps {
  presentationId: string;
  token: string;
  question: QuestionDto;
  index: number;
  total: number;
  onSaved(question: QuestionDto): void;
  onMove(direction: -1 | 1): void;
  onDelete(): void;
  onReset(): void;
  onError(code: ReturnType<typeof errorCodeOf>): void;
}

/** Edits one question and saves it shortly after typing stops. Keyed by question id. */
export const QuestionPanel = forwardRef<QuestionPanelHandle, QuestionPanelProps>(
  function QuestionPanel(
    { presentationId, token, question, index, total, onSaved, onMove, onDelete, onReset, onError },
    ref,
  ) {
    const { t, tn } = useI18n();
    const id = useId();
    const type = question.type as QuestionTypeKey;
    const ui = getQuestionTypeUi(type);
    const [title, setTitle] = useState(question.title);
    const [config, setConfig] = useState<unknown>(question.config);
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
    const latest = useRef({ title, config });
    latest.current = { title, config };
    const saved = useRef({ title: question.title, config: question.config });
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const callbacks = useRef({ onSaved, onError });
    callbacks.current = { onSaved, onError };

    const flush = useCallback(async () => {
      clearTimeout(timer.current);
      const body: UpdateQuestionBody = {};
      if (latest.current.title !== saved.current.title) body.title = latest.current.title;
      if (
        latest.current.config !== saved.current.config &&
        getQuestionType(type).configSchema.safeParse(latest.current.config).success
      ) {
        body.config = latest.current.config;
      }
      if (body.title === undefined && body.config === undefined) return;
      saved.current = {
        title: body.title ?? saved.current.title,
        config: body.config ?? saved.current.config,
      };
      setSaveState('saving');
      try {
        callbacks.current.onSaved(
          await api.updateQuestion(presentationId, token, question.id, body),
        );
        setSaveState('saved');
      } catch (error) {
        callbacks.current.onError(errorCodeOf(error));
        setSaveState('idle');
      }
    }, [presentationId, token, question.id, type]);

    useImperativeHandle(ref, () => ({ flush }), [flush]);

    useEffect(() => {
      if (title === saved.current.title && config === saved.current.config) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
    }, [title, config, flush]);

    // Switching to another question unmounts this panel: save what was typed.
    useEffect(() => () => void flush(), [flush]);

    return (
      <section
        aria-labelledby={`${id}-heading`}
        className="flex flex-col gap-6 rounded-3xl bg-paper p-5 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={`${id}-heading`} className="flex items-center gap-2 text-lg font-extrabold">
            <ui.Icon className="size-6 text-series" />
            {index + 1}. {t(ui.labelKey)}
          </h2>
          <p aria-live="polite" className="text-sm text-muted">
            {saveState === 'saving'
              ? t('common.saving')
              : saveState === 'saved'
                ? t('common.saved')
                : ''}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-title`} className="font-bold">
            {t('editor.question.title.label')}
          </label>
          <textarea
            id={`${id}-title`}
            rows={2}
            className={`${inputClass} resize-y text-2xl font-bold`}
            value={title}
            maxLength={LIMITS.questionTitle}
            placeholder={t('editor.question.title.placeholder')}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <Suspense fallback={<p className="text-muted">{t('common.loading')}</p>}>
          <ui.Editor config={config} onChange={setConfig} />
        </Suspense>

        <div className="flex flex-wrap items-center gap-2 border-t-2 border-line pt-5">
          <p className="mr-auto text-muted">
            {tn('editor.question.responses', question.responseCount)}
          </p>
          {question.responseCount > 0 ? (
            <Button variant="secondary" onClick={onReset}>
              {t('editor.question.reset')}
            </Button>
          ) : null}
          <Button
            variant="quiet"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={t('editor.question.moveUp')}
            title={t('editor.question.moveUp')}
          >
            ↑
          </Button>
          <Button
            variant="quiet"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={t('editor.question.moveDown')}
            title={t('editor.question.moveDown')}
          >
            ↓
          </Button>
          <ConfirmButton onConfirm={onDelete} label={t('editor.question.delete')}>
            {t('editor.question.delete')}
          </ConfirmButton>
        </div>
      </section>
    );
  },
);
