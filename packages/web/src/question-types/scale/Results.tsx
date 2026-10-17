import { useI18n } from '../../i18n/I18nProvider';
import type { ResultsProps } from '../types';

/** Distribution as one-hue columns, with the average as the headline number. */
export function ScaleResults({ config, results }: ResultsProps<'scale'>) {
  const { t, tn, language } = useI18n();
  const max = Math.max(1, ...results.distribution);
  const columns = results.distribution.map((count, offset) => ({
    value: config.min + offset,
    count,
  }));
  const average =
    results.average === null
      ? '–'
      : results.average.toLocaleString(language, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });

  return (
    <div className="flex h-full flex-col justify-center gap-[2em] pb-[1em] sm:flex-row sm:items-end sm:justify-start">
      <div className="shrink-0 sm:w-[9em] sm:self-center">
        <p className="text-[5em] font-extrabold leading-none">{average}</p>
        <p className="mt-[0.3em] text-[1.3em] font-bold">{t('scale.results.average')}</p>
        <p className="text-[1.15em] text-muted">{tn('results.answers', results.total)}</p>
      </div>
      <div className="flex min-w-0 flex-1 flex-col sm:self-center">
        {/* A definite height lets each column size its bar in percent. */}
        <div className="flex h-[13em] items-stretch gap-[0.6em]">
          {columns.map(({ value, count }) => (
            <div
              key={value}
              className="flex flex-1 flex-col items-center justify-end gap-[0.3em]"
              title={`${value}: ${count}`}
            >
              <span className="text-[1.3em] font-bold">{count}</span>
              <div
                className="w-full rounded-t-[4px] bg-series transition-[height] duration-500 ease-out"
                style={{ height: count === 0 ? '2px' : `calc((100% - 2em) * ${count / max})` }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-[0.6em] border-t-2 border-ink/20 pt-[0.3em]">
          {columns.map(({ value }) => (
            <span key={value} className="flex-1 text-center text-[1.35em] font-bold text-muted">
              {value}
            </span>
          ))}
        </div>
        {config.minLabel || config.maxLabel ? (
          <div className="mt-[0.3em] flex justify-between gap-4 text-[1.15em] text-muted">
            <span>{config.minLabel}</span>
            <span className="text-right">{config.maxLabel}</span>
          </div>
        ) : null}
      </div>
      <table className="sr-only">
        <tbody>
          {columns.map(({ value, count }) => (
            <tr key={value}>
              <th scope="row">{value}</th>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
