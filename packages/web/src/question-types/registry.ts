import type { QuestionTypeKey } from '@oyla/shared';
import { type ComponentType, lazy } from 'react';
import { BarsIcon, CloudIcon, NoteIcon, ScaleIcon } from './icons';
import { MultipleChoiceRespond } from './multiple-choice/Respond';
import { OpenEndedRespond } from './open-ended/Respond';
import { ScaleRespond } from './scale/Respond';
import type { AnyQuestionTypeUi, QuestionTypeUi } from './types';
import { WordCloudRespond } from './word-cloud/Respond';

/** Lazy-loads one named export, so phones never download editors or results charts. */
function lazyNamed<P>(
  load: () => Promise<Record<string, unknown>>,
  name: string,
): ComponentType<P> {
  return lazy(async () => ({
    default: (await load())[name] as ComponentType<P>,
  })) as unknown as ComponentType<P>;
}

/**
 * The UI half of every question type; the other half lives in packages/shared. The mapped type
 * makes a type registered in shared but missing here a compile error.
 */
export const questionTypeUis: { [K in QuestionTypeKey]: QuestionTypeUi<K> } = {
  'multiple-choice': {
    labelKey: 'type.multiple-choice.label',
    descriptionKey: 'type.multiple-choice.description',
    Icon: BarsIcon,
    Editor: lazyNamed(() => import('./multiple-choice/Editor'), 'MultipleChoiceEditor'),
    Respond: MultipleChoiceRespond,
    Results: lazyNamed(() => import('./multiple-choice/Results'), 'MultipleChoiceResults'),
  },
  'word-cloud': {
    labelKey: 'type.word-cloud.label',
    descriptionKey: 'type.word-cloud.description',
    Icon: CloudIcon,
    Editor: lazyNamed(() => import('./word-cloud/Editor'), 'WordCloudEditor'),
    Respond: WordCloudRespond,
    Results: lazyNamed(() => import('./word-cloud/Results'), 'WordCloudResults'),
  },
  'open-ended': {
    labelKey: 'type.open-ended.label',
    descriptionKey: 'type.open-ended.description',
    Icon: NoteIcon,
    Editor: lazyNamed(() => import('./open-ended/Editor'), 'OpenEndedEditor'),
    Respond: OpenEndedRespond,
    Results: lazyNamed(() => import('./open-ended/Results'), 'OpenEndedResults'),
  },
  scale: {
    labelKey: 'type.scale.label',
    descriptionKey: 'type.scale.description',
    Icon: ScaleIcon,
    Editor: lazyNamed(() => import('./scale/Editor'), 'ScaleEditor'),
    Respond: ScaleRespond,
    Results: lazyNamed(() => import('./scale/Results'), 'ScaleResults'),
  },
};

export function getQuestionTypeUi(key: QuestionTypeKey): AnyQuestionTypeUi {
  return questionTypeUis[key] as unknown as AnyQuestionTypeUi;
}
