import type { ErrorCode } from '@oyla/shared';
import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';

export function ErrorNotice({
  code,
  children,
}: {
  code: ErrorCode | 'NETWORK';
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div
      role="alert"
      className="rounded-xl border-2 border-danger/40 bg-danger-soft px-4 py-3 text-ink"
    >
      <p>{t(`error.${code}`)}</p>
      {children}
    </div>
  );
}
