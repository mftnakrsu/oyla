import { LIMITS } from '@oyla/shared';
import { useId, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { CharCount, inputClass, RespondForm } from '../shared';
import type { RespondProps } from '../types';

export function WordCloudRespond({ onSubmit }: RespondProps<'word-cloud'>) {
  const { t } = useI18n();
  const id = useId();
  const [text, setText] = useState('');

  return (
    <RespondForm
      submitLabel={t('wc.respond.submit')}
      canSubmit={text.trim().length > 0}
      onSubmit={async () => {
        if (await onSubmit({ text })) setText('');
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="sr-only">
          {t('wc.respond.label')}
        </label>
        <input
          id={id}
          aria-describedby={`${id}-count`}
          className={inputClass}
          value={text}
          maxLength={LIMITS.wordCloudEntry}
          placeholder={t('wc.respond.placeholder')}
          autoComplete="off"
          enterKeyHint="send"
          onChange={(event) => setText(event.target.value)}
        />
        <CharCount id={`${id}-count`} value={text} max={LIMITS.wordCloudEntry} />
      </div>
    </RespondForm>
  );
}
