import { useId, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { RespondForm } from '../shared';
import type { RespondProps } from '../types';

/** One row of numbers per statement; sending needs a rating for each. */
export function MultiScaleRespond({ config, onSubmit }: RespondProps<'multi-scale'>) {
  const { t } = useI18n();
  const id = useId();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const values = Array.from({ length: config.max - config.min + 1 }, (_, i) => config.min + i);
  const complete = config.statements.every((statement) => ratings[statement.id] !== undefined);

  return (
    <RespondForm
      submitLabel={t('scale.respond.submit')}
      canSubmit={complete}
      onSubmit={async () => {
        if (!complete) return;
        // Only the current statements, in case the presenter edited them meanwhile.
        await onSubmit({
          ratings: Object.fromEntries(
            config.statements.map((statement) => [statement.id, ratings[statement.id] ?? 0]),
          ),
        });
      }}
    >
      <div className="flex flex-col gap-6">
        {config.minLabel || config.maxLabel ? (
          <p className="text-sm text-muted">
            {config.min} = {config.minLabel || '–'} · {config.max} = {config.maxLabel || '–'}
          </p>
        ) : null}
        {config.statements.map((statement, index) => {
          const label = statement.label || t('multiScale.statement.placeholder', { n: index + 1 });
          return (
            <fieldset key={statement.id} className="flex flex-col gap-2">
              <legend className="mb-1 font-medium">{label}</legend>
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(values.length, 6)}, minmax(0, 1fr))`,
                }}
              >
                {values.map((n) => {
                  const picked = ratings[statement.id] === n;
                  return (
                    <label
                      key={n}
                      className={`grid min-h-12 cursor-pointer place-items-center rounded-xl border-2 text-lg font-medium has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${
                        picked
                          ? 'border-brand bg-brand text-on-brand'
                          : 'border-line bg-paper hover:border-muted'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`${id}-${statement.id}`}
                        value={n}
                        checked={picked}
                        aria-label={t('multiScale.respond.rate', { statement: label, n })}
                        onChange={() =>
                          setRatings((current) => ({ ...current, [statement.id]: n }))
                        }
                        className="sr-only"
                      />
                      {n}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </RespondForm>
  );
}
