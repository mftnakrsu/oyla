import { useI18n } from '../../i18n/I18nProvider';
import { UpvoteIcon } from '../icons';
import { EmptyResults, HideButton } from '../shared';
import type { ResultsProps } from '../types';

/** Questions from the audience, most upvoted first, each with its vote count. */
export function QaResults({ results, onHide }: ResultsProps<'qa'>) {
  const { tn } = useI18n();
  if (results.entries.length === 0) return <EmptyResults />;
  return (
    <div className="flex h-full flex-col gap-[0.6em]">
      <p className="text-[1.05em] text-muted">{tn('qa.results.questions', results.total)}</p>
      <ol className="flex flex-col gap-[0.6em]">
        {results.entries.map((entry) => (
          <li
            key={entry.key}
            className="slip-in flex items-center gap-[0.8em] rounded-md border-2 border-line bg-paper px-[0.9em] py-[0.6em]"
          >
            <span
              className="grid min-w-[2.6em] shrink-0 place-items-center rounded-lg bg-brand-soft px-[0.4em] py-[0.2em] text-center leading-tight"
              title={tn('results.votes', entry.votes)}
            >
              <UpvoteIcon className="size-[1.1em] text-muted" />
              <span className="text-[1.3em] font-semibold">{entry.votes}</span>
              <span className="sr-only">{tn('results.votes', entry.votes)}</span>
            </span>
            <span className="min-w-0 flex-1 break-words text-[1.4em] leading-snug">
              {entry.text}
            </span>
            {onHide ? <HideButton text={entry.text} onHide={() => onHide(entry.key)} /> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
