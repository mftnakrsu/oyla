import { LIMITS, type PresentationDto, type QuestionDto, type QuestionTypeKey } from '@oyla/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { api, errorCodeOf } from '../api/client';
import { Button } from '../components/Button';
import { ConfirmButton } from '../components/ConfirmButton';
import { ErrorNotice } from '../components/ErrorNotice';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Logo } from '../components/Logo';
import { Shell } from '../components/Shell';
import { useCopy } from '../components/useCopy';
import { useI18n } from '../i18n/I18nProvider';
import { dropHash, readKeyFromHash } from '../lib/admin-key';
import { adminUrl, formatJoinCode, joinUrl } from '../lib/format';
import { forgetMine, listMine, saveMine, tokenFor, updateMine } from '../lib/my-presentations';
import { getQuestionTypeUi } from '../question-types/registry';
import { QuestionPanel, type QuestionPanelHandle } from './editor/QuestionPanel';
import { TypePicker } from './editor/TypePicker';

type ErrorState = ReturnType<typeof errorCodeOf> | null;

function TitleField({ value, onSave }: { value: string; onSave(title: string): void }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    const title = draft.trim();
    if (title && title !== value) onSave(title);
    else setDraft(value);
  };
  return (
    <input
      aria-label={t('editor.title.label')}
      value={draft}
      maxLength={LIMITS.presentationTitle}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
      className="min-h-11 min-w-0 flex-1 rounded-lg border-2 border-transparent bg-transparent px-2 text-xl font-extrabold hover:border-line focus:border-ink focus:bg-paper focus:outline-none"
    />
  );
}

function AdminLinkBanner({ link, onDismiss }: { link: string; onDismiss(): void }) {
  const { t } = useI18n();
  const [copied, copy] = useCopy();
  return (
    <div className="mx-auto mt-4 max-w-6xl px-4">
      <section className="flex flex-col gap-3 rounded-2xl border-2 border-stamp/50 bg-stamp-soft p-5">
        <h2 className="text-lg font-extrabold">{t('editor.adminLink.title')}</h2>
        <p>{t('editor.adminLink.body')}</p>
        <code className="block overflow-x-auto rounded-lg bg-paper px-3 py-2 text-sm">{link}</code>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => copy(link)}>
            {copied ? t('common.copied') : t('editor.adminLink.copy')}
          </Button>
          <Button variant="secondary" onClick={onDismiss}>
            {t('editor.adminLink.dismiss')}
          </Button>
        </div>
      </section>
    </div>
  );
}

export function EditorPage() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [token] = useState(() => readKeyFromHash() ?? tokenFor(id));
  const [presentation, setPresentation] = useState<PresentationDto | null>(null);
  const [loadError, setLoadError] = useState<ErrorState>(null);
  const [actionError, setActionError] = useState<ErrorState>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [showBanner, setShowBanner] = useState(searchParams.get('new') === '1');
  const panel = useRef<QuestionPanelHandle>(null);
  const [copiedJoin, copyJoin] = useCopy();
  const [copiedAdmin, copyAdmin] = useCopy();

  useEffect(() => dropHash(), []);

  useEffect(() => {
    if (!token) return;
    api
      .getPresentation(id, token)
      .then((loaded) => {
        setPresentation(loaded);
        setSelectedId((current) => current ?? loaded.questions[0]?.id ?? null);
        if (listMine().some((item) => item.id === loaded.id)) {
          updateMine(loaded.id, { title: loaded.title, joinCode: loaded.joinCode });
        } else {
          saveMine({
            id: loaded.id,
            title: loaded.title,
            joinCode: loaded.joinCode,
            adminToken: token,
            createdAt: loaded.createdAt,
          });
        }
      })
      .catch((error) => setLoadError(errorCodeOf(error)));
  }, [id, token]);

  const replaceQuestion = useCallback((question: QuestionDto) => {
    setPresentation((current) =>
      current
        ? {
            ...current,
            questions: current.questions.map((q) => (q.id === question.id ? question : q)),
          }
        : current,
    );
  }, []);

  if (!token || loadError === 'UNAUTHORIZED' || loadError === 'NOT_FOUND') {
    return (
      <Shell>
        <h1 className="mb-4 text-3xl font-extrabold">
          {loadError === 'NOT_FOUND' ? t('error.NOT_FOUND') : t('editor.missingKey.title')}
        </h1>
        {loadError === 'NOT_FOUND' ? null : (
          <p className="text-lg text-muted">{t('editor.missingKey.body')}</p>
        )}
      </Shell>
    );
  }
  if (loadError) {
    return (
      <Shell>
        <ErrorNotice code={loadError} />
      </Shell>
    );
  }
  if (!presentation) {
    return (
      <Shell>
        <p className="text-muted">{t('common.loading')}</p>
      </Shell>
    );
  }

  const { questions } = presentation;
  const selectedIndex = questions.findIndex((q) => q.id === selectedId);
  const selected = questions[selectedIndex];
  const run = (action: Promise<unknown>) => {
    setActionError(null);
    action.catch((error) => setActionError(errorCodeOf(error)));
  };

  const addQuestion = (type: QuestionTypeKey) =>
    run(
      api.addQuestion(id, token, { type }).then((question) => {
        setPresentation((current) =>
          current ? { ...current, questions: [...current.questions, question] } : current,
        );
        setSelectedId(question.id);
        setPicking(false);
      }),
    );

  const move = (index: number, direction: -1 | 1) => {
    const ids = questions.map((q) => q.id);
    const target = index + direction;
    const [moved] = ids.splice(index, 1);
    if (!moved || target < 0 || target > ids.length) return;
    ids.splice(target, 0, moved);
    run(api.reorderQuestions(id, token, ids).then(setPresentation));
  };

  const deleteQuestion = (questionId: string, index: number) =>
    run(
      api.deleteQuestion(id, token, questionId).then(() => {
        const rest = questions.filter((q) => q.id !== questionId);
        setPresentation((current) => (current ? { ...current, questions: rest } : current));
        setSelectedId(rest[Math.min(index, rest.length - 1)]?.id ?? null);
      }),
    );

  const present = async () => {
    await panel.current?.flush();
    navigate(`/present/${id}`);
  };

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b-2 border-line bg-page/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <Logo />
          <TitleField
            value={presentation.title}
            onSave={(title) =>
              run(
                api.renamePresentation(id, token, title).then((updated) => {
                  setPresentation((current) =>
                    current ? { ...current, title: updated.title } : current,
                  );
                  updateMine(id, { title: updated.title });
                }),
              )
            }
          />
          <p className="font-bold text-muted">
            {t('editor.joinCode', { code: formatJoinCode(presentation.joinCode) })}
          </p>
          <Button variant="secondary" onClick={() => copyJoin(joinUrl(presentation.joinCode))}>
            {copiedJoin ? t('common.copied') : t('editor.joinLink.copy')}
          </Button>
          <Button onClick={() => void present()} disabled={questions.length === 0}>
            {t('editor.present')}
          </Button>
          <LanguageSwitcher />
        </div>
      </header>

      {showBanner ? (
        <AdminLinkBanner link={adminUrl(id, token)} onDismiss={() => setShowBanner(false)} />
      ) : null}

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[300px_1fr]">
        <aside aria-labelledby="questions-heading" className="flex flex-col gap-3">
          <h2 id="questions-heading" className="text-lg font-extrabold">
            {t('editor.questions')}
          </h2>
          {questions.length > 0 ? (
            <ol className="flex flex-col gap-1">
              {questions.map((question, index) => {
                const ui = getQuestionTypeUi(question.type);
                const current = question.id === selectedId && !picking;
                return (
                  <li key={question.id}>
                    <button
                      type="button"
                      aria-current={current ? 'true' : undefined}
                      onClick={() => {
                        setSelectedId(question.id);
                        setPicking(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left ${
                        current ? 'border-ink bg-paper' : 'border-transparent hover:bg-paper'
                      }`}
                    >
                      <span className="w-6 shrink-0 text-right font-bold text-muted">
                        {index + 1}
                      </span>
                      <ui.Icon className="size-5 shrink-0 text-series" />
                      <span className={`truncate ${question.title ? 'font-bold' : 'text-muted'}`}>
                        {question.title || t('editor.question.untitled')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : null}
          {questions.length < LIMITS.questionsPerPresentation ? (
            <Button variant="secondary" onClick={() => setPicking(true)} className="justify-start">
              + {t('editor.addQuestion')}
            </Button>
          ) : null}
        </aside>

        <main className="flex min-w-0 flex-col gap-4">
          {actionError ? <ErrorNotice code={actionError} /> : null}
          {picking || questions.length === 0 ? (
            <section aria-labelledby="picker-heading" className="flex flex-col gap-4">
              <h2 id="picker-heading" className="text-2xl font-extrabold">
                {questions.length === 0 ? t('editor.empty.title') : t('editor.chooseType')}
              </h2>
              {questions.length === 0 ? (
                <p className="text-muted">{t('editor.empty.body')}</p>
              ) : null}
              <TypePicker onPick={addQuestion} />
            </section>
          ) : selected ? (
            <QuestionPanel
              key={selected.id}
              ref={panel}
              presentationId={id}
              token={token}
              question={selected}
              index={selectedIndex}
              total={questions.length}
              onSaved={replaceQuestion}
              onMove={(direction) => move(selectedIndex, direction)}
              onDelete={() => deleteQuestion(selected.id, selectedIndex)}
              onReset={() =>
                run(
                  api
                    .resetResults(id, token, selected.id)
                    .then(() => replaceQuestion({ ...selected, responseCount: 0 })),
                )
              }
              onError={setActionError}
            />
          ) : null}
        </main>
      </div>

      <footer className="mx-auto flex max-w-6xl flex-wrap gap-2 border-t-2 border-line px-4 py-6">
        <Button variant="secondary" onClick={() => copyAdmin(adminUrl(id, token))}>
          {copiedAdmin ? t('common.copied') : t('editor.adminLink.copy')}
        </Button>
        <ConfirmButton
          label={t('editor.deletePresentation')}
          onConfirm={() =>
            run(
              api.deletePresentation(id, token).then(() => {
                forgetMine(id);
                navigate('/');
              }),
            )
          }
        >
          {t('editor.deletePresentation')}
        </ConfirmButton>
      </footer>
    </div>
  );
}
