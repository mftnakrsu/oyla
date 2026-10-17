import { useCallback, useEffect, useRef, useState } from 'react';

/** Copies text and reports `copied` for a moment, for "Copy" → "Copied" buttons. */
export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = useCallback((text: string) => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => setCopied(false));
  }, []);
  return [copied, copy];
}
