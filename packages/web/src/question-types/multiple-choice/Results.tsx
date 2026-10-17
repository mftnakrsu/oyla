import { useI18n } from '../../i18n/I18nProvider';
import { percent } from '../shared';
import type { ResultsProps } from '../types';

/** Horizontal bars in one hue: every bar carries its label, so colour never has to. */
export function MultipleChoiceResults({ config, results }: ResultsProps<'multiple-choice'>) {
  const { t, tn } = useI18n();
  const max = Math.max(1, ...Object.values(results.counts));

  return (
    <div className="flex flex-col gap-[0.9em]">
      {config.options.map((option, index) => {
        const count = results.counts[option.id] ?? 0;
        const label = option.label || t('mc.option.placeholder', { n: index + 1 });
        return (
          <div key={option.id} title={`${label}: ${tn('results.votes', count)}`}>
            <div className="mb-[0.3em] flex items-baseline justify-between gap-4">
              <span className="text-[1.35em] font-bold leading-tight">{label}</span>
              <span className="shrink-0 text-[1.2em] text-muted">
                <span className="font-bold text-ink">{percent(count, results.total)}%</span>{' '}
                <span className="text-[0.85em]">({count})</span>
              </span>
            </div>
            <div className="h-[1.1em] w-full">
              <div
                className="h-full rounded-r-[4px] bg-series transition-[width] duration-500 ease-out"
                style={{ width: count === 0 ? '2px' : `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="mt-[0.4em] text-[1.05em] text-muted">{tn('results.votes', results.total)}</p>
      <table className="sr-only">
        <tbody>
          {config.options.map((option, index) => (
            <tr key={option.id}>
              <th scope="row">{option.label || t('mc.option.placeholder', { n: index + 1 })}</th>
              <td>{results.counts[option.id] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
