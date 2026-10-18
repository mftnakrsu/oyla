import { DEFAULT_THEME, type ThemeKey } from '@oyla/shared';
import { useEffect } from 'react';

/**
 * Shows the page in a presentation's theme (see index.css). Pass null while the presentation is
 * loading; the default theme comes back when the page closes.
 */
export function usePalette(theme: ThemeKey | null | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.palette = theme ?? DEFAULT_THEME;
    return () => {
      root.dataset.palette = DEFAULT_THEME;
    };
  }, [theme]);
}
