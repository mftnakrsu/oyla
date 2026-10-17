import type { QuestionTypeKey } from '@oyla/shared';
import { BarsIcon, CloudIcon, NoteIcon, ScaleIcon } from './icons';
import { MultipleChoiceEditor } from './multiple-choice/Editor';
import { MultipleChoiceRespond } from './multiple-choice/Respond';
import { MultipleChoiceResults } from './multiple-choice/Results';
import { OpenEndedEditor } from './open-ended/Editor';
import { OpenEndedRespond } from './open-ended/Respond';
import { OpenEndedResults } from './open-ended/Results';
import { ScaleEditor } from './scale/Editor';
import { ScaleRespond } from './scale/Respond';
import { ScaleResults } from './scale/Results';
import type { AnyQuestionTypeUi, QuestionTypeUi } from './types';
import { WordCloudEditor } from './word-cloud/Editor';
import { WordCloudRespond } from './word-cloud/Respond';
import { WordCloudResults } from './word-cloud/Results';

/**
 * The UI half of every question type; the other half lives in packages/shared. The mapped type
 * makes a type registered in shared but missing here a compile error.
 */
export const questionTypeUis: { [K in QuestionTypeKey]: QuestionTypeUi<K> } = {
  'multiple-choice': {
    labelKey: 'type.multiple-choice.label',
    descriptionKey: 'type.multiple-choice.description',
    Icon: BarsIcon,
    Editor: MultipleChoiceEditor,
    Respond: MultipleChoiceRespond,
    Results: MultipleChoiceResults,
  },
  'word-cloud': {
    labelKey: 'type.word-cloud.label',
    descriptionKey: 'type.word-cloud.description',
    Icon: CloudIcon,
    Editor: WordCloudEditor,
    Respond: WordCloudRespond,
    Results: WordCloudResults,
  },
  'open-ended': {
    labelKey: 'type.open-ended.label',
    descriptionKey: 'type.open-ended.description',
    Icon: NoteIcon,
    Editor: OpenEndedEditor,
    Respond: OpenEndedRespond,
    Results: OpenEndedResults,
  },
  scale: {
    labelKey: 'type.scale.label',
    descriptionKey: 'type.scale.description',
    Icon: ScaleIcon,
    Editor: ScaleEditor,
    Respond: ScaleRespond,
    Results: ScaleResults,
  },
};

export function getQuestionTypeUi(key: QuestionTypeKey): AnyQuestionTypeUi {
  return questionTypeUis[key] as unknown as AnyQuestionTypeUi;
}
