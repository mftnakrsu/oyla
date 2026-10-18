import { z } from 'zod';

/**
 * Colour themes a presentation can use. The web app defines the colours of each theme
 * (packages/web/src/index.css); the server only stores the key.
 */
export const THEMES = ['emerald', 'indigo', 'navy', 'blue'] as const;
export type ThemeKey = (typeof THEMES)[number];

export const DEFAULT_THEME: ThemeKey = 'emerald';

export const themeSchema = z.enum(THEMES);

/** Maps a stored value to a known theme, so an unknown key falls back to the default. */
export function toThemeKey(value: unknown): ThemeKey {
  return THEMES.includes(value as ThemeKey) ? (value as ThemeKey) : DEFAULT_THEME;
}
