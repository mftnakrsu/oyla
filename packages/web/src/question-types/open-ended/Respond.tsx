import { LIMITS } from '@oyla/shared';
import { useId, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { CharCount, inputClass, RespondForm } from '../shared';
import type { RespondProps } from '../types';

export function OpenEndedRespond({ onSubmit }: RespondProps<'open-ended'>) {
  const { t } = useI18n();
  const id = useId();
  const [text, setText] = useState('');

  return (
    <RespondForm
      submitLabel={t('oe.respond.submit')}
      canSubmit={text.trim().length > 0}
      onSubmit={async () => {
        if (await onSubmit({ text })) setText('');
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="sr-only">
          {t('oe.respond.label')}
        </label>
        <textarea
          id={id}
          className={`${inputClass} min-h-36 resize-y`}
          value={text}
          maxLength={LIMITS.openEndedEntry}
          placeholder={t('oe.respond.placeholder')}
          onChange={(event) => setText(event.target.value)}
        />
        <CharCount value={text} max={LIMITS.openEndedEntry} />
      </div>
    </RespondForm>
  );
}
