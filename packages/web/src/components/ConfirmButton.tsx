import { type ReactNode, useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './Button';

/** Destructive action that needs a second click within a few seconds; no browser dialogs. */
export function ConfirmButton({
  children,
  onConfirm,
  label,
}: {
  children: ReactNode;
  onConfirm(): void;
  label?: string;
}) {
  const { t } = useI18n();
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);
  return (
    <Button
      variant="danger"
      aria-label={armed ? t('common.confirmDelete') : label}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? t('common.confirmDelete') : children}
    </Button>
  );
}
