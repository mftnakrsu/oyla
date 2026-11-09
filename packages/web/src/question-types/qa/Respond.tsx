import { cleanText, groupKey, isQaAsk, LIMITS } from '@oyla/shared';
import { useId, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { UpvoteIcon } from '../icons';
import { CharCount, inputClass, RespondForm } from '../shared';
import type { RespondProps } from '../types';

/** Ask a question (while any are left) and upvote everyone else's. */
export function QaRespond({ remaining, onSubmit, results, mine = [] }: RespondProps<'qa'>) {
  const { t, tn } = useI18n();
  const id = useId();
  const [text, setText] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  // Own questions are added here as typed; the server cleans and trims them the same way.
  const asked = new Set(
    mine.filter(isQaAsk).map((response) => groupKey(cleanText(response.text).trim())),
  );
  const upvoted = new Set(mine.flatMap((response) => (isQaAsk(response) ? [] : [response.upvote])));

  const upvote = async (key: string) => {
    setPending(key);
    try {
      await onSubmit({ upvote: key });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {remaining > 0 ? (
        <RespondForm
          submitLabel={t('qa.respond.submit')}
          canSubmit={text.trim().length > 0}
          onSubmit={async () => {
            if (await onSubmit({ text })) setText('');
          }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor={id} className="font-medium">
              {t('qa.respond.label')}
            </label>
            <textarea
              id={id}
              aria-describedby={`${id}-count`}
              className={`${inputClass} min-h-24 resize-y`}
              value={text}
              maxLength={LIMITS.qaQuestion}
              placeholder={t('qa.respond.placeholder')}
              onChange={(event) => setText(event.target.value)}
            />
            <CharCount id={`${id}-count`} value={text} max={LIMITS.qaQuestion} />
          </div>
        </RespondForm>
      ) : (
        <p className="rounded-xl bg-paper px-4 py-3 text-muted">{t('qa.respond.noneLeft')}</p>
      )}

      <section aria-labelledby={`${id}-list`} className="flex flex-col gap-3">
        <h2 id={`${id}-list`} className="text-lg font-semibold">
          {t('qa.respond.list')}
        </h2>
        {results === null ? (
          <p className="text-muted">{t('qa.respond.hidden')}</p>
        ) : !results || results.entries.length === 0 ? (
          <p className="text-muted">{t('qa.respond.empty')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {results.entries.map((entry, index) => {
              const own = asked.has(entry.key);
              const done = upvoted.has(entry.key);
              // Answered questions come last; the first one starts their own heading.
              const firstAnswered = entry.answered && !results.entries[index - 1]?.answered;
              return (
                <li
                  key={entry.key}
                  className={`flex flex-col gap-2 ${firstAnswered ? 'mt-2' : ''}`}
                >
                  {firstAnswered ? (
                    <h3 className="font-semibold text-muted">{t('qa.respond.answered')}</h3>
                  ) : null}
                  <div
                    className={`flex items-center gap-3 rounded-xl border-2 border-line px-3 py-2 ${
                      entry.answered ? 'bg-paper/60 text-muted' : 'bg-paper'
                    }`}
                  >
                    <span className="min-w-0 flex-1 break-words">
                      {entry.text}
                      {own ? (
                        <span className="ml-2 text-sm text-muted">{t('qa.respond.yours')}</span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      disabled={own || done || entry.answered || pending !== null}
                      aria-pressed={done}
                      aria-label={t('qa.respond.upvote', { text: entry.text })}
                      onClick={() => void upvote(entry.key)}
                      className={`flex min-h-11 min-w-14 shrink-0 items-center justify-center gap-1 rounded-lg border-2 px-2 font-medium ${
                        done ? 'border-brand bg-brand text-on-brand' : 'border-line'
                      } disabled:cursor-default ${own || entry.answered ? 'opacity-50' : ''}`}
                    >
                      <UpvoteIcon className="size-5" />
                      <span>{entry.votes}</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {results && results.entries.length > 0 ? (
          <p className="text-sm text-muted">{tn('qa.results.questions', results.total)}</p>
        ) : null}
      </section>
    </div>
  );
}
