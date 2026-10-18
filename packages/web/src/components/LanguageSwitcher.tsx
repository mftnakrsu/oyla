import { LANGUAGES, type Language, useI18n } from '../i18n/I18nProvider';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  return (
    <fieldset className="flex items-center rounded-lg border-2 border-line p-0.5">
      <legend className="sr-only">{t('lang.label')}</legend>
      {(Object.keys(LANGUAGES) as Language[]).map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={language === code}
          title={LANGUAGES[code]}
          onClick={() => setLanguage(code)}
          className={`min-h-10 min-w-10 rounded-md px-2.5 text-sm font-bold ${
            language === code ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </fieldset>
  );
}
