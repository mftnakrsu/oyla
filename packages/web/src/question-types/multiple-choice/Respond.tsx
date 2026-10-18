import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { RespondForm } from '../shared';
import type { RespondProps } from '../types';

export function MultipleChoiceRespond({ config, onSubmit }: RespondProps<'multiple-choice'>) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <RespondForm
      submitLabel={t('mc.respond.submit')}
      canSubmit={selected !== null}
      onSubmit={async () => {
        if (selected) await onSubmit({ optionId: selected });
      }}
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{t('mc.respond.pick')}</legend>
        {config.options.map((option, index) => {
          const checked = selected === option.id;
          return (
            <label
              key={option.id}
              className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-xl border-2 bg-paper px-4 py-3 text-lg transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${
                checked ? 'border-brand' : 'border-line hover:border-muted'
              }`}
            >
              <input
                type="radio"
                name="option"
                value={option.id}
                checked={checked}
                onChange={() => setSelected(option.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${
                  checked ? 'border-brand bg-brand' : 'border-line'
                }`}
              >
                {checked ? <span className="size-2.5 rounded-full bg-on-brand" /> : null}
              </span>
              <span className="font-bold">
                {option.label || t('mc.option.placeholder', { n: index + 1 })}
              </span>
            </label>
          );
        })}
      </fieldset>
    </RespondForm>
  );
}
