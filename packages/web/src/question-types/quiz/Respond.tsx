import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { RespondProps } from '../types';

/** One tap answers: speed counts, so there is no separate send button. */
export function QuizRespond({ config, onSubmit }: RespondProps<'quiz'>) {
  const { t } = useI18n();
  const [sending, setSending] = useState<string | null>(null);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">{t('quiz.respond.pick')}</legend>
      {config.options.map((option, index) => (
        <button
          key={option.id}
          type="button"
          disabled={sending !== null}
          onClick={async () => {
            setSending(option.id);
            try {
              await onSubmit({ optionId: option.id });
            } finally {
              setSending(null);
            }
          }}
          className={`flex min-h-16 items-center gap-4 rounded-xl border-2 bg-paper px-4 py-3 text-left text-lg font-medium transition-colors disabled:cursor-default ${
            sending === option.id ? 'border-brand' : 'border-line hover:border-muted'
          }`}
        >
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-base"
          >
            {String.fromCharCode(65 + index)}
          </span>
          <span>{option.label || t('mc.option.placeholder', { n: index + 1 })}</span>
        </button>
      ))}
    </fieldset>
  );
}
