import { useI18n } from '../../i18n/I18nProvider';
import { CheckIcon } from '../icons';
import { percent } from '../shared';
import type { ResultsProps } from '../types';

/**
 * Bars per option. Once revealed, the correct option is marked with a check and the word
 * "Correct", not by colour alone.
 */
export function QuizResults({ config, results, revealed = false }: ResultsProps<'quiz'>) {
  const { t, tn } = useI18n();
  const max = Math.max(1, ...Object.values(results.counts));

  return (
    <div className="flex h-full flex-col justify-center-safe gap-[1.3em] pb-[1em]">
      {revealed ? (
        <p className="text-[1.3em] font-medium text-muted">{t('present.timeUp')}</p>
      ) : null}
      {config.options.map((option, index) => {
        const count = results.counts[option.id] ?? 0;
        const label = option.label || t('mc.option.placeholder', { n: index + 1 });
        const correct = revealed && option.id === config.correctOptionId;
        return (
          <div
            key={option.id}
            className={revealed && !correct ? 'opacity-55' : undefined}
            title={`${label}: ${tn('results.votes', count)}`}
          >
            <div className="mb-[0.3em] flex items-baseline justify-between gap-4">
              <span className="flex items-baseline gap-[0.4em] text-[1.6em] font-medium leading-tight">
                {correct ? (
                  <span className="inline-flex items-center gap-[0.25em] self-center rounded-md bg-brand px-[0.4em] py-[0.1em] text-[0.7em] text-on-brand">
                    <CheckIcon />
                    {t('quiz.correct')}
                  </span>
                ) : null}
                {label}
              </span>
              <span className="shrink-0 text-[1.45em] text-muted">
                <span className="font-medium text-ink">{percent(count, results.total)}%</span>{' '}
                <span className="text-[0.85em]">({count})</span>
              </span>
            </div>
            <div className="h-[1.6em] w-full">
              <div
                className={`h-full rounded-r transition-[width] duration-500 ease-out ${
                  correct ? 'bg-brand' : 'bg-series'
                }`}
                style={{ width: count === 0 ? '2px' : `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-[1.15em] text-muted">{tn('results.answers', results.total)}</p>
    </div>
  );
}
