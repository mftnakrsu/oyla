import { useI18n } from '../../i18n/I18nProvider';
import type { ResultsProps } from '../types';

/** The average per statement as a horizontal bar along the scale. */
export function MultiScaleResults({ config, results }: ResultsProps<'multi-scale'>) {
  const { t, tn, language } = useI18n();
  const averages = new Map(results.statements.map((statement) => [statement.id, statement]));
  const span = config.max - config.min;
  const format = (value: number) =>
    value.toLocaleString(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <div className="flex h-full flex-col justify-center-safe gap-[1.1em] pb-[1em]">
      <p className="text-[1.15em] text-muted">{tn('results.answers', results.total)}</p>
      <ul className="flex flex-col gap-[0.9em]">
        {config.statements.map((statement, index) => {
          const result = averages.get(statement.id);
          const average = result?.average ?? null;
          const share = average === null || span === 0 ? 0 : (average - config.min) / span;
          const label = statement.label || t('multiScale.statement.placeholder', { n: index + 1 });
          return (
            <li key={statement.id} className="flex flex-col gap-[0.3em]">
              <div className="flex items-baseline justify-between gap-[1em]">
                <span className="min-w-0 break-words text-[1.4em] font-medium">{label}</span>
                <span className="shrink-0 text-[1.6em] font-semibold">
                  {average === null ? '–' : format(average)}
                </span>
              </div>
              <div
                className="h-[1.1em] overflow-hidden rounded-full bg-ink/10"
                role="img"
                aria-label={
                  average === null
                    ? `${label}: –`
                    : `${label}: ${t('scale.results.average')} ${format(average)}, ${tn('results.answers', result?.count ?? 0)}`
                }
              >
                <div
                  className="h-full rounded-full bg-series transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-between gap-4 text-[1.15em] text-muted">
        <span>
          {config.min}
          {config.minLabel ? ` · ${config.minLabel}` : ''}
        </span>
        <span className="text-right">
          {config.maxLabel ? `${config.maxLabel} · ` : ''}
          {config.max}
        </span>
      </div>
    </div>
  );
}
