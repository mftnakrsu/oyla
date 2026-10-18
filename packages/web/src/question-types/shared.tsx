import { type FormEvent, type ReactNode, useState } from 'react';
import { Button } from '../components/Button';
import { useI18n } from '../i18n/I18nProvider';

export const inputClass =
  'w-full rounded-xl border-2 border-line bg-paper px-4 py-3 text-lg text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none';

export function CharCount({ id, value, max }: { id: string; value: string; max: number }) {
  const { t } = useI18n();
  const left = max - value.length;
  return (
    <p id={id} className={`text-sm ${left < 10 ? 'text-stamp' : 'text-muted'}`}>
      {t('common.charsLeft', { count: left })}
    </p>
  );
}

/** Form wrapper for Respond components: one submit button, busy while the answer is in flight. */
export function RespondForm({
  children,
  submitLabel,
  canSubmit,
  onSubmit,
}: {
  children: ReactNode;
  submitLabel: string;
  canSubmit: boolean;
  onSubmit(): Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const handle = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      await onSubmit();
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={handle} className="flex flex-col gap-5">
      {children}
      <Button type="submit" size="lg" disabled={!canSubmit || busy} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}

export function EmptyResults() {
  const { t } = useI18n();
  return <p className="py-[2em] text-center text-[1.25em] text-muted">{t('results.empty')}</p>;
}

export function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}
