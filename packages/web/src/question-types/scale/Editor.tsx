import { LIMITS } from '@oyla/shared';
import { useId } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { inputClass } from '../shared';
import type { EditorProps } from '../types';

const selectClass = 'min-h-11 rounded-xl border-2 border-line bg-paper px-3 text-lg';

export function ScaleEditor({ config, onChange }: EditorProps<'scale'>) {
  const { t } = useI18n();
  const id = useId();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 font-bold">
          {t('scale.min.label')}
          <select
            className={selectClass}
            value={config.min}
            onChange={(event) =>
              onChange({ ...config, min: Number(event.target.value) === 0 ? 0 : 1 })
            }
          >
            <option value={0}>0</option>
            <option value={1}>1</option>
          </select>
        </label>
        <label className="flex items-center gap-2 font-bold">
          {t('scale.max.label')}
          <select
            className={selectClass}
            value={config.max}
            onChange={(event) => onChange({ ...config, max: Number(event.target.value) })}
          >
            {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-min`} className="font-bold">
            {t('scale.minLabel.label')}
          </label>
          <input
            id={`${id}-min`}
            className={inputClass}
            value={config.minLabel}
            maxLength={LIMITS.scaleLabel}
            placeholder={t('scale.minLabel.placeholder')}
            onChange={(event) => onChange({ ...config, minLabel: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-max`} className="font-bold">
            {t('scale.maxLabel.label')}
          </label>
          <input
            id={`${id}-max`}
            className={inputClass}
            value={config.maxLabel}
            maxLength={LIMITS.scaleLabel}
            placeholder={t('scale.maxLabel.placeholder')}
            onChange={(event) => onChange({ ...config, maxLabel: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
