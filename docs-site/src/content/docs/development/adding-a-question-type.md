---
title: Adding a question type
description: A step-by-step guide to adding a new question type, from the shared definition to the React components and the tests.
---

A question type has two halves:

- **A definition in `packages/shared`.** It says what a valid config and a valid answer look like,
  how many answers one person may give, and how answers turn into results. The server uses only
  this half; it has no code for individual types.
- **Three React components in `packages/web`.** `Editor` for the presenter's settings, `Respond`
  for the phone form and `Results` for the presenter screen.

Each half has a registry. TypeScript reports an error until a type is in both, and a test checks
the same thing at runtime. You don't need to touch the server, the REST API, the socket protocol or
the database: configs and answers are stored as JSON.

This guide builds a small example type, **Number**: everyone answers with a whole number in a
range, and the presenter screen shows the median and the average. The four existing types in the
same folders are good references; `scale` is the closest to this example.

## The interfaces

`packages/shared/src/question-types/define.ts` defines what the server needs:

```ts title="packages/shared/src/question-types/define.ts"
export interface QuestionTypeDefinition<TConfig, TResponse, TResults> {
  /** Registry key, stored in the database. Never rename a released type. */
  type: string;
  /** The presenter's settings for one question. */
  configSchema: z.ZodType<TConfig>;
  /** Settings for a newly added question. Must pass configSchema. */
  defaultConfig(): TConfig;
  /** One participant answer, validated against the current config. */
  responseSchema(config: TConfig): z.ZodType<TResponse>;
  /** How many answers one participant may give to this question. */
  maxResponses(config: TConfig): number;
  /** Turns stored answers (oldest first) into what the presenter view shows. Must be pure. */
  aggregate(config: TConfig, responses: TResponse[]): TResults;
  /** What participants may see of the config. Defaults to all of it. */
  toPublicConfig?(config: TConfig): unknown;
}
```

`defineQuestionType(definition)` returns the definition unchanged; it exists so TypeScript infers
the three type parameters.

`packages/web/src/question-types/types.ts` defines the props of the components. `K` is the type's
registry key, and `ConfigOf<K>`, `ResponseOf<K>` and `ResultsOf<K>` look up the types from the
shared definition:

```ts title="packages/web/src/question-types/types.ts"
export interface EditorProps<K extends QuestionTypeKey> {
  config: ConfigOf<K>;
  onChange(config: ConfigOf<K>): void;
}

export interface RespondProps<K extends QuestionTypeKey> {
  config: ConfigOf<K>;
  /** Answers the participant may still give. */
  remaining: number;
  /** Resolves true when the server accepted the answer. */
  onSubmit(response: ResponseOf<K>): Promise<boolean>;
}

export interface ResultsProps<K extends QuestionTypeKey> {
  config: ConfigOf<K>;
  results: ResultsOf<K>;
}
```

## 1. Define the type in shared

Create `packages/shared/src/question-types/number.ts`:

```ts title="packages/shared/src/question-types/number.ts"
import { z } from 'zod';
import { defineQuestionType } from './define';

const LIMIT = 1_000_000;

const configSchema = z
  .object({
    min: z.number().int().min(-LIMIT).max(LIMIT),
    max: z.number().int().min(-LIMIT).max(LIMIT),
  })
  .refine((config) => config.min < config.max, { message: 'min must be below max' });

export type NumberConfig = z.infer<typeof configSchema>;
export type NumberResponse = { value: number };
export type NumberResults = { median: number | null; average: number | null; total: number };

export const numberQuestion = defineQuestionType<NumberConfig, NumberResponse, NumberResults>({
  type: 'number',
  configSchema,
  defaultConfig: () => ({ min: 0, max: 100 }),
  responseSchema: (config) => z.object({ value: z.number().int().min(config.min).max(config.max) }),
  maxResponses: () => 1,
  aggregate: (config, responses) => {
    // The presenter may narrow the range after people answered: ignore values outside it.
    const values = responses
      .map((response) => response.value)
      .filter((value) => value >= config.min && value <= config.max)
      .sort((a, b) => a - b);
    if (values.length === 0) {
      return { median: null, average: null, total: 0 };
    }
    const middle = Math.floor(values.length / 2);
    const median =
      values.length % 2 === 1
        ? (values[middle] ?? 0)
        : ((values[middle - 1] ?? 0) + (values[middle] ?? 0)) / 2;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return { median, average, total: values.length };
  },
});
```

The `?? 0` fallbacks are there because the repository compiles with `noUncheckedIndexedAccess`.

Then register it in `packages/shared/src/question-types/registry.ts`. The order of this object is
the order of the cards in the editor's type picker.

```ts title="packages/shared/src/question-types/registry.ts" ins={3,13}
import type { QuestionTypeDefinition } from './define';
import { multipleChoice } from './multiple-choice';
import { numberQuestion } from './number';
import { openEnded } from './open-ended';
import { scale } from './scale';
import { wordCloud } from './word-cloud';

export const questionTypes = {
  'multiple-choice': multipleChoice,
  'word-cloud': wordCloud,
  'open-ended': openEnded,
  scale,
  number: numberQuestion,
} as const;
```

And export the module from `packages/shared/src/index.ts`, next to the other types:

```ts title="packages/shared/src/index.ts"
export * from './question-types/number';
```

From now on, `QuestionTypeKey` includes `'number'`, the REST API accepts `{ "type": "number" }`
and the server validates and aggregates answers to it.

### Rules for the definition

- **The `type` key is stored in the database.** Pick it carefully and never rename it after a
  release, or existing questions stop loading.
- **`responseSchema` is the only check on what phones send.** Bound every string length and number
  range. Anything it accepts ends up in the database and on the presenter screen.
- **The config can change after people answered.** `aggregate` gets the current config and every
  stored answer, so skip answers that no longer fit, the way multiple choice ignores removed
  options and scale ignores values outside a new range.
- **Keep `aggregate` pure and the results small.** It runs over all answers (up to 2,000) whenever
  the presenter needs fresh results, and its output goes over the socket up to four times a second.
  Cap long lists, as the word cloud does with its top 100.
- **Use `toPublicConfig` for secrets.** Phones receive the config through it. A quiz type, for
  example, would remove the correct answer there.
- **Configs and answers must be plain JSON.** They are stored as JSON text.

## 2. Add the components in web

Create a folder `packages/web/src/question-types/number/` with three files. Use the helpers in
`packages/web/src/question-types/shared.tsx`: `inputClass` for text fields, `RespondForm` for the
phone form (one submit button that is busy while the answer is in flight) and `EmptyResults` for
the "Waiting for the first answer" state.

### Editor

The editor receives the current config and reports changes. The editor page saves after a short
pause, and only when the config passes `configSchema`, so a half-typed range is never sent.

```tsx title="packages/web/src/question-types/number/Editor.tsx"
import { useId } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { inputClass } from '../shared';
import type { EditorProps } from '../types';

export function NumberEditor({ config, onChange }: EditorProps<'number'>) {
  const { t } = useI18n();
  const id = useId();
  const toInt = (text: string) => Math.trunc(Number(text) || 0);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-min`} className="font-bold">
          {t('number.min.label')}
        </label>
        <input
          id={`${id}-min`}
          type="number"
          step={1}
          className={inputClass}
          value={config.min}
          onChange={(event) => onChange({ ...config, min: toInt(event.target.value) })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-max`} className="font-bold">
          {t('number.max.label')}
        </label>
        <input
          id={`${id}-max`}
          type="number"
          step={1}
          className={inputClass}
          value={config.max}
          onChange={(event) => onChange({ ...config, max: toInt(event.target.value) })}
        />
      </div>
    </div>
  );
}
```

### Respond

The phone form calls `onSubmit` with an answer of the type's response shape. The page around it
shows the thanks screen when the server accepts the answer and an error message when it doesn't.

```tsx title="packages/web/src/question-types/number/Respond.tsx"
import { useId, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { inputClass, RespondForm } from '../shared';
import type { RespondProps } from '../types';

export function NumberRespond({ config, onSubmit }: RespondProps<'number'>) {
  const { t } = useI18n();
  const id = useId();
  const [text, setText] = useState('');
  const value = Number(text);
  const valid =
    text.trim() !== '' && Number.isInteger(value) && value >= config.min && value <= config.max;

  return (
    <RespondForm
      submitLabel={t('number.respond.submit')}
      canSubmit={valid}
      onSubmit={async () => {
        if (valid) await onSubmit({ value });
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="font-bold">
          {t('number.respond.label', { min: config.min, max: config.max })}
        </label>
        <input
          id={id}
          type="number"
          step={1}
          min={config.min}
          max={config.max}
          className={inputClass}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
    </RespondForm>
  );
}
```

### Results

The presenter screen scales its font size with the window, so size things in `em` and they grow
on a projector. Don't rely on colour alone to carry meaning.

```tsx title="packages/web/src/question-types/number/Results.tsx"
import { useI18n } from '../../i18n/I18nProvider';
import { EmptyResults } from '../shared';
import type { ResultsProps } from '../types';

export function NumberResults({ results }: ResultsProps<'number'>) {
  const { t, tn, language } = useI18n();
  if (results.median === null || results.average === null) return <EmptyResults />;
  const format = (value: number) => value.toLocaleString(language, { maximumFractionDigits: 1 });
  return (
    <div className="flex h-full flex-wrap items-center gap-[3em]">
      <div>
        <p className="text-[5em] font-extrabold leading-none">{format(results.median)}</p>
        <p className="mt-[0.3em] text-[1.3em] font-bold">{t('number.results.median')}</p>
      </div>
      <div>
        <p className="text-[3em] font-extrabold leading-none">{format(results.average)}</p>
        <p className="mt-[0.3em] text-[1.3em] font-bold">{t('number.results.average')}</p>
      </div>
      <p className="text-[1.15em] text-muted">{tn('results.answers', results.total)}</p>
    </div>
  );
}
```

### Icon

Add an icon to `packages/web/src/question-types/icons.tsx`, drawn like the others on a 24 × 24
grid with `currentColor`:

```tsx title="packages/web/src/question-types/icons.tsx"
export function HashIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" {...base} className={className} strokeLinecap="round">
      <path d="M10 4 8 20M16 4l-2 16M5 9h15M4 15h15" />
    </svg>
  );
}
```

## 3. Register the components

Add an entry to `questionTypeUis` in `packages/web/src/question-types/registry.ts`. Import
`Respond` directly; load `Editor` and `Results` with `lazy()`, so phones never download them.
TypeScript checks the export names inside `then(...)`, so a typo is a compile error.

```tsx title="packages/web/src/question-types/registry.ts" ins={1,3,9-16}
import { BarsIcon, CloudIcon, HashIcon, NoteIcon, ScaleIcon } from './icons';
import { MultipleChoiceRespond } from './multiple-choice/Respond';
import { NumberRespond } from './number/Respond';
import { OpenEndedRespond } from './open-ended/Respond';
// …

export const questionTypeUis: { [K in QuestionTypeKey]: QuestionTypeUi<K> } = {
  // …the four existing types
  number: {
    labelKey: 'type.number.label',
    descriptionKey: 'type.number.description',
    Icon: HashIcon,
    Editor: lazy(() => import('./number/Editor').then((m) => ({ default: m.NumberEditor }))),
    Respond: NumberRespond,
    Results: lazy(() => import('./number/Results').then((m) => ({ default: m.NumberResults }))),
  },
};
```

The mapped type `{ [K in QuestionTypeKey]: QuestionTypeUi<K> }` is what turns a type missing on
the web side into a compile error.

## 4. Add the wording

Every key goes into `packages/web/src/i18n/en.ts` **and** `tr.ts`. A key missing from `tr.ts` is a
type error, and a test checks that both use the same `{placeholders}`.

```ts title="packages/web/src/i18n/en.ts"
  'type.number.label': 'Number',
  'type.number.description': 'Everyone answers with a number. The screen shows the median.',
  'number.min.label': 'Lowest allowed',
  'number.max.label': 'Highest allowed',
  'number.respond.label': 'A whole number from {min} to {max}',
  'number.respond.submit': 'Send number',
  'number.results.median': 'Median',
  'number.results.average': 'Average',
```

```ts title="packages/web/src/i18n/tr.ts"
  'type.number.label': 'Sayı',
  'type.number.description': 'Herkes bir sayıyla cevap verir. Ekranda medyan görünür.',
  'number.min.label': 'En küçük değer',
  'number.max.label': 'En büyük değer',
  'number.respond.label': '{min} ile {max} arasında bir tam sayı',
  'number.respond.submit': 'Sayıyı gönder',
  'number.results.median': 'Medyan',
  'number.results.average': 'Ortalama',
```

If you don't speak Turkish, write your best guess and mention it in the pull request.

## 5. Add tests

**Shared definition.** Create `packages/shared/src/question-types/number.test.ts` next to the
others. Test the config schema, the response schema and `aggregate`, including answers that no
longer fit a changed config:

```ts title="packages/shared/src/question-types/number.test.ts"
import { describe, expect, test } from 'vitest';
import { numberQuestion } from './number';

const config = { min: 0, max: 100 };

describe('number question', () => {
  test('min must be below max', () => {
    expect(numberQuestion.configSchema.safeParse({ min: 5, max: 5 }).success).toBe(false);
  });

  test('accepts whole numbers inside the range only', () => {
    const schema = numberQuestion.responseSchema(config);
    expect(schema.safeParse({ value: 42 }).success).toBe(true);
    expect(schema.safeParse({ value: 101 }).success).toBe(false);
    expect(schema.safeParse({ value: 4.5 }).success).toBe(false);
  });

  test('computes the median and the average, ignoring values outside the range', () => {
    const results = numberQuestion.aggregate(config, [
      { value: 10 },
      { value: 90 },
      { value: 20 },
      { value: 500 },
    ]);
    expect(results).toEqual({ median: 20, average: 40, total: 3 });
  });

  test('has no median without answers', () => {
    expect(numberQuestion.aggregate(config, [])).toEqual({
      median: null,
      average: null,
      total: 0,
    });
  });
});
```

**Shared registry.** `packages/shared/src/question-types/registry.test.ts` lists the registered
keys. Add `'number'` to the expected list. The other registry tests (every default config passes
its own schema, every type is registered under its own key) cover the new type automatically.

**Phone form.** Add a test to `packages/web/src/question-types/respond.test.tsx`, which renders
each `Respond` component in English:

```tsx title="packages/web/src/question-types/respond.test.tsx"
test('number sends a whole number inside the range', async () => {
  const onSubmit = vi.fn().mockResolvedValue(true);
  renderEn(<NumberRespond config={{ min: 0, max: 100 }} remaining={1} onSubmit={onSubmit} />);
  const field = screen.getByLabelText('A whole number from 0 to 100');
  const send = screen.getByRole('button', { name: 'Send number' });
  await userEvent.type(field, '250');
  expect(send).toBeDisabled();
  await userEvent.clear(field);
  await userEvent.type(field, '42');
  await userEvent.click(send);
  expect(onSubmit).toHaveBeenCalledWith({ value: 42 });
});
```

A `Results` test in the same file is welcome too. The web registry test
(`packages/web/src/question-types/registry.test.ts`) and the dictionary tests need no changes;
they check the new type on their own.

## 6. Check and try it

```bash
npm run typecheck
npm test
npm run lint
npm run dev
```

In the browser, create a presentation, add a **Number** question, select **Present**, and answer
from a second window at `http://localhost:5173/join/<code>`. Check the editor, the phone form and
the presenter screen in both languages and in dark mode.

## Checklist

- [ ] `packages/shared/src/question-types/<type>.ts` with `defineQuestionType`
- [ ] Registered in `packages/shared/src/question-types/registry.ts` and exported from
      `packages/shared/src/index.ts`
- [ ] `Editor.tsx`, `Respond.tsx` and `Results.tsx` in `packages/web/src/question-types/<type>/`
- [ ] An icon in `icons.tsx` and an entry in `packages/web/src/question-types/registry.ts`
- [ ] Strings in `en.ts` and `tr.ts`
- [ ] `<type>.test.ts` in shared, the registry key list updated, a `Respond` test in web
- [ ] `npm run typecheck`, `npm test` and `npm run lint` pass

When you open the pull request, add a screenshot of the presenter screen and the phone.
