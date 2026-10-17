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
    <div className="flex h-full flex-col gap-[1em] sm:flex-row sm:items-end">
      <div className="shrink-0 sm:w-[8em]">
        <p className="text-[4em] font-extrabold leading-none">{average}</p>
        <p className="mt-[0.3em] text-[1.1em] text-muted">{t('scale.results.average')}</p>
        <p className="text-[1.05em] text-muted">{tn('results.answers', results.total)}</p>
      </div>
      <div className="flex min-h-[10em] flex-1 flex-col">
        <div className="flex flex-1 items-end gap-[0.5em]">
          {columns.map(({ value, count }) => {
            return (
              <div
                key={value}
                className="flex h-full flex-1 flex-col items-center justify-end gap-[0.3em]"
                title={`${value}: ${count}`}
              >
                <span className="text-[1.1em] font-bold">{count}</span>
                <div
                  className="w-full rounded-t-[4px] bg-series transition-[height] duration-500 ease-out"
                  style={{ height: count === 0 ? '2px' : `${(count / max) * 100}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-[0.4em] flex gap-[0.5em] border-t-2 border-line pt-[0.3em]">
          {columns.map(({ value }) => (
            <span key={value} className="flex-1 text-center text-[1.15em] font-bold text-muted">
              {value}
            </span>
          ))}
        </div>
        {config.minLabel || config.maxLabel ? (
          <div className="mt-[0.2em] flex justify-between gap-4 text-[1em] text-muted">
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
