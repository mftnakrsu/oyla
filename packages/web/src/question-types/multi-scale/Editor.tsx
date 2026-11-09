import { LIMITS, randomId } from '@oyla/shared';
import { Button } from '../../components/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { CloseIcon } from '../icons';
import { ScaleEditor } from '../scale/Editor';
import { inputClass } from '../shared';
import type { EditorProps } from '../types';

/** The shared scale (range and end labels) and the statements people rate on it. */
export function MultiScaleEditor({ config, onChange }: EditorProps<'multi-scale'>) {
  const { t } = useI18n();
  const { statements } = config;
  const setLabel = (id: string, label: string) =>
    onChange({
      ...config,
      statements: statements.map((statement) =>
        statement.id === id ? { ...statement, label } : statement,
      ),
    });

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-medium">{t('multiScale.statements')}</legend>
        {statements.map((statement, index) => (
          <div key={statement.id} className="flex items-center gap-2">
            <input
              className={inputClass}
              value={statement.label}
              maxLength={LIMITS.optionLabel}
              placeholder={t('multiScale.statement.placeholder', { n: index + 1 })}
              aria-label={t('multiScale.statement.placeholder', { n: index + 1 })}
              onChange={(event) => setLabel(statement.id, event.target.value)}
            />
            <Button
              variant="quiet"
              aria-label={t('multiScale.statement.remove', { n: index + 1 })}
              disabled={statements.length <= LIMITS.statementsMin}
              onClick={() =>
                onChange({ ...config, statements: statements.filter((s) => s.id !== statement.id) })
              }
              className="shrink-0 text-muted"
            >
              <CloseIcon className="size-5" />
            </Button>
          </div>
        ))}
        <div>
          <Button
            variant="secondary"
            disabled={statements.length >= LIMITS.statementsMax}
            onClick={() =>
              onChange({ ...config, statements: [...statements, { id: randomId(8), label: '' }] })
            }
          >
            {t('multiScale.statement.add')}
          </Button>
        </div>
      </fieldset>
      <ScaleEditor config={config} onChange={(scale) => onChange({ ...config, ...scale })} />
    </div>
  );
}
