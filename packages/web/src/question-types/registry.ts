import type { QuestionTypeKey } from '@oyla/shared';
import { lazy } from 'react';
import { BarsIcon, CloudIcon, NoteIcon, QaIcon, QuizIcon, ScaleIcon } from './icons';
import { MultipleChoiceRespond } from './multiple-choice/Respond';
import { OpenEndedRespond } from './open-ended/Respond';
import { QaRespond } from './qa/Respond';
import { QuizRespond } from './quiz/Respond';
import { ScaleRespond } from './scale/Respond';
import type { AnyQuestionTypeUi, QuestionTypeUi } from './types';
import { WordCloudRespond } from './word-cloud/Respond';

/**
 * The UI half of every question type; the other half lives in packages/shared. The mapped type
 * makes a type registered in shared but missing here a compile error.
 */
export const questionTypeUis: { [K in QuestionTypeKey]: QuestionTypeUi<K> } = {
  'multiple-choice': {
    labelKey: 'type.multiple-choice.label',
    descriptionKey: 'type.multiple-choice.description',
    Icon: BarsIcon,
    Editor: lazy(() =>
      import('./multiple-choice/Editor').then((m) => ({ default: m.MultipleChoiceEditor })),
    ),
    Respond: MultipleChoiceRespond,
    Results: lazy(() =>
      import('./multiple-choice/Results').then((m) => ({ default: m.MultipleChoiceResults })),
    ),
  },
  'word-cloud': {
    labelKey: 'type.word-cloud.label',
    descriptionKey: 'type.word-cloud.description',
    Icon: CloudIcon,
    Editor: lazy(() => import('./word-cloud/Editor').then((m) => ({ default: m.WordCloudEditor }))),
    Respond: WordCloudRespond,
    Results: lazy(() =>
      import('./word-cloud/Results').then((m) => ({ default: m.WordCloudResults })),
    ),
  },
  'open-ended': {
    labelKey: 'type.open-ended.label',
    descriptionKey: 'type.open-ended.description',
    Icon: NoteIcon,
    Editor: lazy(() => import('./open-ended/Editor').then((m) => ({ default: m.OpenEndedEditor }))),
    Respond: OpenEndedRespond,
    Results: lazy(() =>
      import('./open-ended/Results').then((m) => ({ default: m.OpenEndedResults })),
    ),
  },
  scale: {
    labelKey: 'type.scale.label',
    descriptionKey: 'type.scale.description',
    Icon: ScaleIcon,
    Editor: lazy(() => import('./scale/Editor').then((m) => ({ default: m.ScaleEditor }))),
    Respond: ScaleRespond,
    Results: lazy(() => import('./scale/Results').then((m) => ({ default: m.ScaleResults }))),
  },
  qa: {
    labelKey: 'type.qa.label',
    descriptionKey: 'type.qa.description',
    Icon: QaIcon,
    Editor: lazy(() => import('./qa/Editor').then((m) => ({ default: m.QaEditor }))),
    Respond: QaRespond,
    Results: lazy(() => import('./qa/Results').then((m) => ({ default: m.QaResults }))),
  },
  quiz: {
    labelKey: 'type.quiz.label',
    descriptionKey: 'type.quiz.description',
    Icon: QuizIcon,
    Editor: lazy(() => import('./quiz/Editor').then((m) => ({ default: m.QuizEditor }))),
    Respond: QuizRespond,
    Results: lazy(() => import('./quiz/Results').then((m) => ({ default: m.QuizResults }))),
  },
};

export function getQuestionTypeUi(key: QuestionTypeKey): AnyQuestionTypeUi {
  return questionTypeUis[key] as unknown as AnyQuestionTypeUi;
}
