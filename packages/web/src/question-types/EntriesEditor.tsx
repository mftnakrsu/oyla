import { LIMITS } from '@oyla/shared';
import { useId } from 'react';
import type { MessageKey } from '../i18n/en';
import { useI18n } from '../i18n/I18nProvider';

/** "Answers per person" picker shared by the word cloud, open questions and Q&A. */
export function EntriesEditor({
  value,
  onChange,
  labelKey = 'entries.label',
}: {
  value: number;
  onChange(value: number): void;
  labelKey?: MessageKey;
}) {
  const { t } = useI18n();
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="font-bold">
        {t(labelKey)}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-h-11 rounded-xl border-2 border-line bg-paper px-3 text-lg"
      >
        {Array.from({ length: LIMITS.maxEntries }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}
