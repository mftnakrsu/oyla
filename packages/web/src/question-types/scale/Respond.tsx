import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { RespondForm } from '../shared';
import type { RespondProps } from '../types';

export function ScaleRespond({ config, onSubmit }: RespondProps<'scale'>) {
  const { t } = useI18n();
  const [value, setValue] = useState<number | null>(null);
  const values = Array.from({ length: config.max - config.min + 1 }, (_, i) => config.min + i);

  return (
    <RespondForm
      submitLabel={t('scale.respond.submit')}
      canSubmit={value !== null}
      onSubmit={async () => {
        if (value !== null) await onSubmit({ value });
      }}
    >
      <fieldset>
        <legend className="sr-only">{t('scale.respond.pick')}</legend>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(values.length, 6)}, minmax(0, 1fr))` }}
        >
          {values.map((n) => (
            <label
              key={n}
              className={`grid min-h-14 cursor-pointer place-items-center rounded-xl border-2 text-xl font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${
                value === n
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line bg-paper hover:border-muted'
              }`}
            >
              <input
                type="radio"
                name="scale"
                value={n}
                checked={value === n}
                onChange={() => setValue(n)}
                className="sr-only"
              />
              {n}
            </label>
          ))}
        </div>
        {config.minLabel || config.maxLabel ? (
          <div className="mt-2 flex justify-between gap-4 text-sm text-muted">
            <span>{config.minLabel}</span>
            <span className="text-right">{config.maxLabel}</span>
          </div>
        ) : null}
      </fieldset>
    </RespondForm>
  );
}
