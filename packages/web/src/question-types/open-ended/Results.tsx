import { moderationKeyOf } from '@oyla/shared';
import { useI18n } from '../../i18n/I18nProvider';
import { EmptyResults, HideButton } from '../shared';
import type { ResultsProps } from '../types';

/** Answers as paper slips, newest first. */
export function OpenEndedResults({ results, onHide }: ResultsProps<'open-ended'>) {
  const { tn } = useI18n();
  if (results.entries.length === 0) return <EmptyResults />;
  return (
    <div className="flex h-full flex-col gap-[0.6em]">
      <p className="text-[1.05em] text-muted">{tn('results.answers', results.total)}</p>
      <ul className="columns-1 gap-[0.75em] sm:columns-2 xl:columns-3">
        {results.entries.map((entry) => (
          <li
            key={entry.key}
            className="slip-in mb-[0.75em] flex break-inside-avoid items-start gap-[0.5em] whitespace-pre-line break-words rounded-md border-2 border-line bg-paper px-[0.9em] py-[0.7em] text-[1.4em] leading-snug"
          >
            <span className="min-w-0 flex-1">{entry.text}</span>
            {onHide ? (
              <HideButton
                text={entry.text}
                onHide={() =>
                  onHide(moderationKeyOf('open-ended', { text: entry.text }) ?? entry.text)
                }
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
