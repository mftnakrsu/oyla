import { type ReactNode, useEffect, useState } from 'react';
import { Button } from './Button';

/** Destructive action that needs a second click within a few seconds; no browser dialogs. */
export function ConfirmButton({
  children,
  onConfirm,
  label,
  confirmLabel,
  variant = 'danger',
}: {
  children: ReactNode;
  onConfirm(): void;
  label: string;
  confirmLabel: string;
  variant?: 'danger' | 'secondary';
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);
  return (
    <Button
      variant={armed ? 'danger' : variant}
      aria-label={armed ? confirmLabel : label}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? confirmLabel : children}
    </Button>
  );
}
