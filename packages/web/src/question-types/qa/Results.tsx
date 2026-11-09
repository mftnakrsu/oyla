import type { QaEntry } from '@oyla/shared';
import { useI18n } from '../../i18n/I18nProvider';
import { UpvoteIcon } from '../icons';
import { EmptyResults, HideButton, MarkAnsweredButton } from '../shared';
import type { ResultsProps } from '../types';

/**
 * Questions from the audience, most upvoted first, each with its vote count. Questions the
 * presenter marked as answered follow in their own list.
 */
export function QaResults({ results, onHide, onMarkAnswered }: ResultsProps<'qa'>) {
  const { t, tn } = useI18n();
  if (results.entries.length === 0) return <EmptyResults />;
  // Older results (before answered existed) have no flag: treat them as open.
  const open = results.entries.filter((entry) => !entry.answered);
  const answered = results.entries.filter((entry) => entry.answered);

  const item = (entry: QaEntry) => (
    <li
      key={entry.key}
      className={`slip-in flex items-center gap-[0.8em] rounded-md border-2 border-line px-[0.9em] py-[0.6em] ${
        entry.answered ? 'bg-paper/60 text-muted' : 'bg-paper'
      }`}
    >
      <span
        className="grid min-w-[2.6em] shrink-0 place-items-center rounded-lg bg-brand-soft px-[0.4em] py-[0.2em] text-center leading-tight"
        title={tn('results.votes', entry.votes)}
      >
        <UpvoteIcon className="size-[1.1em] text-muted" />
        <span className="text-[1.3em] font-semibold">{entry.votes}</span>
        <span className="sr-only">{tn('results.votes', entry.votes)}</span>
      </span>
      <span className="min-w-0 flex-1 break-words text-[1.4em] leading-snug">{entry.text}</span>
      {onMarkAnswered ? (
        <MarkAnsweredButton
          text={entry.text}
          answered={entry.answered}
          onToggle={() => onMarkAnswered(entry.key, !entry.answered)}
        />
      ) : null}
      {onHide ? <HideButton text={entry.text} onHide={() => onHide(entry.key)} /> : null}
    </li>
  );

  return (
    <div className="flex h-full flex-col gap-[0.6em]">
      <p className="text-[1.05em] text-muted">{tn('qa.results.questions', results.total)}</p>
      {open.length > 0 ? <ol className="flex flex-col gap-[0.6em]">{open.map(item)}</ol> : null}
      {answered.length > 0 ? (
        <section className="mt-[0.6em] flex flex-col gap-[0.6em]">
          <h2 className="text-[1.05em] font-semibold text-muted">{t('qa.results.answered')}</h2>
          <ol className="flex flex-col gap-[0.6em]">{answered.map(item)}</ol>
        </section>
      ) : null}
    </div>
  );
}
