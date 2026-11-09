import { LIMITS, QUIZ_POINTS, QUIZ_SECONDS, randomId } from '@oyla/shared';
import { useId } from 'react';
import { Button } from '../../components/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { CheckIcon, CloseIcon } from '../icons';
import { inputClass } from '../shared';
import type { EditorProps } from '../types';

/** Options with one marked correct, and the time people get to answer. */
export function QuizEditor({ config, onChange }: EditorProps<'quiz'>) {
  const { t } = useI18n();
  const id = useId();
  const { options, correctOptionId, seconds } = config;
  // Quizzes saved before these settings existed don't have them yet.
  const points = config.points ?? LIMITS.quizPoints;
  const speedCounts = config.speedCounts ?? true;
  const setLabel = (optionId: string, label: string) =>
    onChange({
      ...config,
      options: options.map((option) => (option.id === optionId ? { ...option, label } : option)),
    });
  const remove = (optionId: string) => {
    const rest = options.filter((o) => o.id !== optionId);
    // Removing the correct option moves the mark to the first one left.
    const correct = optionId === correctOptionId ? (rest[0]?.id ?? '') : correctOptionId;
    onChange({ ...config, options: rest, correctOptionId: correct });
  };
  const timeChoices = QUIZ_SECONDS.includes(seconds as (typeof QUIZ_SECONDS)[number])
    ? QUIZ_SECONDS
    : [...QUIZ_SECONDS, seconds].sort((a, b) => a - b);
  const pointChoices = QUIZ_POINTS.includes(points as (typeof QUIZ_POINTS)[number])
    ? QUIZ_POINTS
    : [...QUIZ_POINTS, points].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-medium">{t('mc.options')}</legend>
        <p className="mb-1 text-sm text-muted">{t('quiz.correct.hint')}</p>
        {options.map((option, index) => {
          const correct = option.id === correctOptionId;
          return (
            <div key={option.id} className="flex items-center gap-2">
              <label
                className={`grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border-2 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${
                  correct ? 'border-brand bg-brand text-on-brand' : 'border-line text-muted'
                }`}
                title={t('quiz.correct.mark', { n: index + 1 })}
              >
                <input
                  type="radio"
                  name={`${id}-correct`}
                  className="sr-only"
                  checked={correct}
                  aria-label={t('quiz.correct.mark', { n: index + 1 })}
                  onChange={() => onChange({ ...config, correctOptionId: option.id })}
                />
                <CheckIcon className="size-5" />
              </label>
              <input
                className={inputClass}
                value={option.label}
                maxLength={LIMITS.optionLabel}
                placeholder={t('mc.option.placeholder', { n: index + 1 })}
                aria-label={t('mc.option.placeholder', { n: index + 1 })}
                onChange={(event) => setLabel(option.id, event.target.value)}
              />
              <Button
                variant="quiet"
                aria-label={t('mc.option.remove', { n: index + 1 })}
                disabled={options.length <= LIMITS.optionsMin}
                onClick={() => remove(option.id)}
                className="shrink-0 text-muted"
              >
                <CloseIcon className="size-5" />
              </Button>
            </div>
          );
        })}
        <div>
          <Button
            variant="secondary"
            disabled={options.length >= LIMITS.optionsMax}
            onClick={() =>
              onChange({ ...config, options: [...options, { id: randomId(8), label: '' }] })
            }
          >
            {t('mc.option.add')}
          </Button>
        </div>
      </fieldset>
      <div className="flex items-center gap-3">
        <label htmlFor={`${id}-seconds`} className="font-medium">
          {t('quiz.seconds.label')}
        </label>
        <select
          id={`${id}-seconds`}
          value={seconds}
          onChange={(event) => onChange({ ...config, seconds: Number(event.target.value) })}
          className="min-h-11 rounded-xl border-2 border-line bg-paper px-3 text-lg"
        >
          {timeChoices.map((n) => (
            <option key={n} value={n}>
              {t('quiz.seconds.value', { count: n })}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <label htmlFor={`${id}-points`} className="font-medium">
          {t('quiz.worth.label')}
        </label>
        <select
          id={`${id}-points`}
          value={points}
          onChange={(event) => onChange({ ...config, points: Number(event.target.value) })}
          className="min-h-11 rounded-xl border-2 border-line bg-paper px-3 text-lg"
        >
          {pointChoices.map((n) => (
            <option key={n} value={n}>
              {n === 0 ? t('quiz.worth.none') : t('quiz.worth.value', { points: n })}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-5 accent-brand"
          checked={speedCounts}
          disabled={points === 0}
          onChange={(event) => onChange({ ...config, speedCounts: event.target.checked })}
        />
        <span className="flex flex-col">
          <span className="font-medium">{t('quiz.speed.label')}</span>
          <span className="text-sm text-muted">{t('quiz.speed.hint')}</span>
        </span>
      </label>
    </div>
  );
}
