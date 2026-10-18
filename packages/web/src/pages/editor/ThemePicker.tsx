import { THEMES, type ThemeKey } from '@oyla/shared';
import { useI18n } from '../../i18n/I18nProvider';

/** Four swatches; each one carries its own data-palette, so it shows that theme's colours. */
export function ThemePicker({
  value,
  onChange,
}: {
  value: ThemeKey;
  onChange(theme: ThemeKey): void;
}) {
  const { t } = useI18n();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-lg font-extrabold">{t('editor.theme.label')}</legend>
      <p className="text-sm text-muted">{t('editor.theme.hint')}</p>
      <div className="mt-1 grid grid-cols-2 gap-2">
        {THEMES.map((theme) => (
          <label
            key={theme}
            data-palette={theme}
            className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border-2 bg-paper px-3 py-2 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${
              value === theme ? 'border-brand' : 'border-line hover:border-muted'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={theme}
              checked={value === theme}
              onChange={() => onChange(theme)}
              className="sr-only"
            />
            <span aria-hidden="true" className="flex shrink-0 -space-x-1.5">
              <span className="size-5 rounded-full border-2 border-paper bg-brand" />
              <span className="size-5 rounded-full border-2 border-paper bg-series" />
            </span>
            <span className="text-sm font-bold leading-tight text-ink">{t(`theme.${theme}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
