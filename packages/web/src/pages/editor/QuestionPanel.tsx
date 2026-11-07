import {
  type ErrorCode,
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
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useI18n } from '../../i18n/I18nProvider';
import { ArrowDownIcon, ArrowUpIcon } from '../../question-types/icons';
import { getQuestionTypeUi } from '../../question-types/registry';
import { inputClass } from '../../question-types/shared';

const SAVE_DELAY_MS = 500;
const MAX_RETRIES = 5;
const RETRYABLE = new Set<ErrorCode | 'NETWORK'>(['NETWORK', 'INTERNAL', 'RATE_LIMITED']);

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

/**
 * Edits one question and saves it shortly after typing stops. Saves run one at a time, so
 * responses can't arrive out of order, and a failed save is retried instead of being forgotten.
 * Keyed by question id.
 */
export const QuestionPanel = forwardRef<QuestionPanelHandle, QuestionPanelProps>(
  function QuestionPanel(
    { presentationId, token, question, index, total, onSaved, onMove, onDelete, onReset, onError },
    ref,
  ) {
    const { t, tn } = useI18n();
    const id = useId();
    const type = question.type as QuestionTypeKey;
    const ui = getQuestionTypeUi(type);
    const [configReadable] = useState(
      () => getQuestionType(type).configSchema.safeParse(question.config).success,
    );
    const [title, setTitle] = useState(question.title);
    const [config, setConfig] = useState<unknown>(question.config);
    const [resultsHidden, setResultsHidden] = useState(question.resultsHidden);
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'retrying'>('idle');
    const latest = useRef({ title, config, resultsHidden });
    latest.current = { title, config, resultsHidden };
    /** What the server has confirmed; only updated after a successful save. */
    const saved = useRef({
      title: question.title,
      config: question.config,
      resultsHidden: question.resultsHidden,
    });
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const queue = useRef<Promise<void>>(Promise.resolve());
    const failures = useRef(0);
    const callbacks = useRef({ onSaved, onError });
    callbacks.current = { onSaved, onError };

    const flush = useCallback((): Promise<void> => {
      clearTimeout(timer.current);
      const run = async () => {
        const body: UpdateQuestionBody = {};
        if (latest.current.title !== saved.current.title) body.title = latest.current.title;
        if (
          latest.current.config !== saved.current.config &&
          getQuestionType(type).configSchema.safeParse(latest.current.config).success
        ) {
          body.config = latest.current.config;
        }
        if (latest.current.resultsHidden !== saved.current.resultsHidden) {
          body.resultsHidden = latest.current.resultsHidden;
        }
        if (
          body.title === undefined &&
          body.config === undefined &&
          body.resultsHidden === undefined
        )
          return;
        const sending = {
          title: body.title ?? saved.current.title,
          config: body.config ?? saved.current.config,
          resultsHidden: body.resultsHidden ?? saved.current.resultsHidden,
        };
        setSaveState('saving');
        try {
          const updated = await api.updateQuestion(presentationId, token, question.id, body);
          saved.current = sending;
          failures.current = 0;
          callbacks.current.onSaved(updated);
          setSaveState('saved');
        } catch (error) {
          const code = errorCodeOf(error);
          if (RETRYABLE.has(code) && failures.current < MAX_RETRIES) {
            failures.current += 1;
            setSaveState('retrying');
            timer.current = setTimeout(() => void flush(), 1500 * failures.current);
          } else {
            setSaveState('idle');
            callbacks.current.onError(code);
          }
        }
      };
      queue.current = queue.current.then(run, run);
      return queue.current;
    }, [presentationId, token, question.id, type]);

    useImperativeHandle(ref, () => ({ flush }), [flush]);

    useEffect(() => {
      if (
        title === saved.current.title &&
        config === saved.current.config &&
        resultsHidden === saved.current.resultsHidden
      )
        return;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
    }, [title, config, resultsHidden, flush]);

    // Switching to another question unmounts this panel: save what was typed.
    useEffect(() => () => void flush(), [flush]);

    const status =
      saveState === 'saving'
        ? t('common.saving')
        : saveState === 'saved'
          ? t('common.saved')
          : saveState === 'retrying'
            ? t('editor.saveRetry')
            : '';

    return (
      <section
        aria-labelledby={`${id}-heading`}
        className="flex flex-col gap-6 rounded-3xl bg-paper p-5 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={`${id}-heading`} className="flex items-center gap-2 text-lg font-semibold">
            <ui.Icon className="size-6 text-series" />
            {index + 1}. {t(ui.labelKey)}
          </h2>
          <p
            aria-live="polite"
            className={`text-sm ${saveState === 'retrying' ? 'text-danger' : 'text-muted'}`}
          >
            {status}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-title`} className="font-medium">
            {t('editor.question.title.label')}
          </label>
          <textarea
            id={`${id}-title`}
            rows={2}
            className={`${inputClass} resize-y text-2xl font-medium`}
            value={title}
            maxLength={LIMITS.questionTitle}
            placeholder={t('editor.question.title.placeholder')}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        {configReadable ? (
          <ErrorBoundary fallback={<p className="text-muted">{t('question.unavailable')}</p>}>
            <Suspense fallback={<p className="text-muted">{t('common.loading')}</p>}>
              <ui.Editor config={config} onChange={setConfig} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <p className="text-muted">{t('question.unavailable')}</p>
        )}

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={resultsHidden}
            onChange={(event) => setResultsHidden(event.target.checked)}
            aria-describedby={`${id}-hide-hint`}
            className="mt-0.5 size-5 shrink-0 accent-brand"
          />
          <span className="flex flex-col">
            <span className="font-medium">{t('editor.question.hideResults')}</span>
            <span id={`${id}-hide-hint`} className="text-sm text-muted">
              {t('editor.question.hideResults.hint')}
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2 border-t-2 border-line pt-5">
          <p className="mr-auto text-muted">
            {tn('editor.question.responses', question.responseCount)}
          </p>
          {question.responseCount > 0 ? (
            <ConfirmButton
              variant="secondary"
              onConfirm={onReset}
              label={t('editor.question.reset')}
              confirmLabel={t('common.confirmReset')}
            >
              {t('editor.question.reset')}
            </ConfirmButton>
          ) : null}
          <Button
            variant="quiet"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={t('editor.question.moveUp')}
            title={t('editor.question.moveUp')}
          >
            <ArrowUpIcon className="size-5" />
          </Button>
          <Button
            variant="quiet"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={t('editor.question.moveDown')}
            title={t('editor.question.moveDown')}
          >
            <ArrowDownIcon className="size-5" />
          </Button>
          <ConfirmButton
            onConfirm={onDelete}
            label={t('editor.question.delete')}
            confirmLabel={t('common.confirmDelete')}
          >
            {t('editor.question.delete')}
          </ConfirmButton>
        </div>
      </section>
    );
  },
);
