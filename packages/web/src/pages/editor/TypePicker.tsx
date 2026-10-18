import { QUESTION_TYPE_KEYS, type QuestionTypeKey } from '@oyla/shared';
import { useI18n } from '../../i18n/I18nProvider';
import { getQuestionTypeUi } from '../../question-types/registry';

export function TypePicker({ onPick }: { onPick(type: QuestionTypeKey): void }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {QUESTION_TYPE_KEYS.map((key) => {
        const ui = getQuestionTypeUi(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onPick(key)}
            className="flex items-start gap-4 rounded-2xl border-2 border-line bg-paper p-5 text-left transition-colors hover:border-brand"
          >
            <ui.Icon className="mt-0.5 size-7 shrink-0 text-series" />
            <span>
              <span className="block text-lg font-extrabold">{t(ui.labelKey)}</span>
              <span className="block text-muted">{t(ui.descriptionKey)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
