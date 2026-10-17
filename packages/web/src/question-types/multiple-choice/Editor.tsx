import { LIMITS, randomId } from '@oyla/shared';
import { Button } from '../../components/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { inputClass } from '../shared';
import type { EditorProps } from '../types';

export function MultipleChoiceEditor({ config, onChange }: EditorProps<'multiple-choice'>) {
  const { t } = useI18n();
  const { options } = config;
  const setLabel = (id: string, label: string) =>
    onChange({
      options: options.map((option) => (option.id === id ? { ...option, label } : option)),
    });

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 font-bold">{t('mc.options')}</legend>
      {options.map((option, index) => (
        <div key={option.id} className="flex items-center gap-2">
          <input
            className={inputClass}
            value={option.label}
            maxLength={LIMITS.optionLabel}
            placeholder={t('mc.option.placeholder', { n: index + 1 })}
            aria-label={t('mc.option.placeholder', { n: index + 1 })}
            onChange={(event) => setLabel(option.id, event.target.value)}
          />
          <Button
            variant="quiet"
            aria-label={t('mc.option.remove', { n: index + 1 })}
            disabled={options.length <= LIMITS.optionsMin}
            onClick={() => onChange({ options: options.filter((o) => o.id !== option.id) })}
            className="shrink-0 text-2xl leading-none text-muted"
          >
            ×
          </Button>
        </div>
      ))}
      <div>
        <Button
          variant="secondary"
          disabled={options.length >= LIMITS.optionsMax}
          onClick={() => onChange({ options: [...options, { id: randomId(8), label: '' }] })}
        >
          {t('mc.option.add')}
        </Button>
      </div>
    </fieldset>
  );
}
