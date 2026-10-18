import { getQuestionType, type PresentationDto, type QuestionDto } from '@oyla/shared';
import { type ReactNode, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api, errorCodeOf } from '../api/client';
import { buttonClass } from '../components/Button';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ErrorNotice } from '../components/ErrorNotice';
import { QrCode } from '../components/QrCode';
import { Shell } from '../components/Shell';
import { Stamp } from '../components/Stamp';
import { useI18n } from '../i18n/I18nProvider';
import { dropHash, readKeyFromHash } from '../lib/admin-key';
import { displayHost, formatJoinCode, joinUrl } from '../lib/format';
import { tokenFor } from '../lib/my-presentations';
import { usePresenterSession } from '../live/usePresenterSession';
import { getQuestionTypeUi } from '../question-types/registry';
import {
  ExitIcon,
  FullscreenIcon,
  InviteIcon,
  NextIcon,
  PeopleIcon,
  PrevIcon,
  ResetIcon,
} from './present/icons';

function ControlButton({
  label,
  onClick,
  disabled,
  armed = false,
  children,
}: {
  label: string;
  onClick(): void;
  disabled?: boolean;
  armed?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-[2.6em] min-w-[2.6em] place-items-center rounded-xl px-[0.5em] disabled:opacity-30 ${
        armed ? 'bg-stamp text-paper' : 'text-ink hover:bg-ink/5'
      }`}
    >
      {children}
    </button>
  );
}

/** Reset needs a second click within a few seconds: it deletes every answer to the question. */
function ResetButton({ onReset, disabled }: { onReset(): void; disabled: boolean }) {
  const { t } = useI18n();
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);
  return (
    <ControlButton
      label={armed ? t('common.confirmReset') : t('present.reset')}
      armed={armed}
      disabled={disabled}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onReset();
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? (
        <span className="text-[0.85em] font-bold">{t('common.confirmReset')}</span>
      ) : (
        <ResetIcon />
      )}
    </ControlButton>
  );
}

function Invite({ code, onClose }: { code: string; onClose(): void }) {
  const { t, tRich } = useI18n();
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => close.current?.focus(), []);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('present.invite')}
      className="fixed inset-0 z-20 grid place-items-center bg-page p-[2em]"
    >
      <div className="flex flex-col items-center gap-[1.5em] text-center">
        <p className="text-[2em] font-bold text-muted">
          {tRich('present.goTo', {
            host: (
              <strong key="host" className="text-ink">
                {displayHost()}
              </strong>
            ),
          })}
        </p>
        <p className="text-[7em] font-extrabold leading-none tracking-[0.08em]">
          {formatJoinCode(code)}
        </p>
        <QrCode value={joinUrl(code)} size={300} label={joinUrl(code)} />
        <button
          ref={close}
          type="button"
          onClick={onClose}
          className={buttonClass('secondary', 'lg')}
        >
          {t('present.inviteClose')}
        </button>
      </div>
    </div>
  );
}

function ActiveQuestion({ question, results }: { question: QuestionDto; results: unknown }) {
  const { t } = useI18n();
  const ui = getQuestionTypeUi(question.type);
  const unavailable = <p className="text-[1.3em] text-muted">{t('question.unavailable')}</p>;
  const readable = getQuestionType(question.type).configSchema.safeParse(question.config).success;
  return (
    <>
      <h1 className="mb-[0.8em] text-balance text-[2.7em] font-extrabold leading-[1.1] tracking-tight">
        {question.title || t('editor.question.untitled')}
      </h1>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {readable && results !== null ? (
          <ErrorBoundary key={question.id} fallback={unavailable}>
            <Suspense fallback={null}>
              <ui.Results config={question.config} results={results} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          unavailable
        )}
      </div>
    </>
  );
}

export function PresentPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t, tn, tRich } = useI18n();
  const [token] = useState(() => readKeyFromHash() ?? tokenFor(id));
  const [presentation, setPresentation] = useState<PresentationDto | null>(null);
  const [loadError, setLoadError] = useState<ReturnType<typeof errorCodeOf> | null>(null);
  const [invite, setInvite] = useState(false);
  const session = usePresenterSession(id, token);
  const autoStarted = useRef(false);

  useEffect(() => dropHash(), []);

  const load = useCallback(() => {
    if (!token) return;
    api
      .getPresentation(id, token)
      .then((loaded) => {
        setPresentation(loaded);
        setLoadError(null);
      })
      .catch((error) => {
        // A failed refresh keeps the last good data on screen; only a bad link or a deleted
        // presentation (or having nothing to show yet) replaces the presenter view.
        const code = errorCodeOf(error);
        setLoadError((current) =>
          code === 'UNAUTHORIZED' || code === 'NOT_FOUND' ? code : (current ?? code),
        );
      });
  }, [id, token]);

  // Load on open, when the window regains focus, and on every state broadcast: questions edited,
  // added, removed or reordered in the editor show up here without a reload.
  // biome-ignore lint/correctness/useExhaustiveDependencies: stateVersion is a reload trigger
  useEffect(() => {
    load();
  }, [load, session.stateVersion]);

  useEffect(() => {
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);

  const questions = presentation?.questions ?? [];
  const index = questions.findIndex((q) => q.id === session.activeQuestionId);
  const active = questions[index];

  // Opening the presenter view starts the presentation at the first question.
  useEffect(() => {
    if (autoStarted.current || session.status !== 'ready' || !presentation) return;
    autoStarted.current = true;
    const first = presentation.questions[0];
    if (!session.activeQuestionId && first) void session.activate(first.id);
  }, [session, presentation]);

  const go = useCallback(
    (delta: -1 | 1) => {
      const target = index === -1 ? questions[0] : questions[index + delta];
      if (target) void session.activate(target.id);
    },
    [index, questions, session],
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (invite) {
        if (event.key === 'Escape' || event.key === 'i') setInvite(false);
        return;
      }
      // Leave typing and focused controls alone (Space or Enter on a button activates it).
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input, textarea, select, button, a')
      )
        return;
      if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault();
        go(1);
      } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        go(-1);
      } else if (event.key === 'f') {
        toggleFullscreen();
      } else if (event.key === 'i') {
        setInvite(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, toggleFullscreen, invite]);

  if (!token || session.status === 'unauthorized' || loadError === 'UNAUTHORIZED') {
    return (
      <Shell>
        <h1 className="mb-4 text-3xl font-extrabold">{t('editor.missingKey.title')}</h1>
        <p className="text-lg text-muted">{t('editor.missingKey.body')}</p>
      </Shell>
    );
  }
  if (session.status === 'ended' || session.status === 'not-found' || loadError === 'NOT_FOUND') {
    return (
      <Shell>
        <h1 className="text-3xl font-extrabold">{t('error.NOT_FOUND')}</h1>
      </Shell>
    );
  }
  if (!presentation) {
    return (
      <Shell>
        {loadError ? (
          <ErrorNotice code={loadError} />
        ) : (
          <p className="text-muted">{t('common.loading')}</p>
        )}
      </Shell>
    );
  }

  const code = presentation.joinCode;
  const message = active ? session.results[active.id] : undefined;
  const readable = active
    ? getQuestionType(active.type).configSchema.safeParse(active.config).success
    : false;
  const results = active
    ? message
      ? message.results
      : readable
        ? getQuestionType(active.type).aggregate(active.config, [])
        : null
    : null;

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      style={{ fontSize: 'clamp(15px, 0.85vw + 0.55vh, 32px)' }}
    >
      <header className="flex items-center justify-between gap-[1.5em] border-b-2 border-line bg-paper px-[1.5em] py-[0.7em]">
        <p className="text-[1.45em] text-muted">
          {tRich('present.join', {
            host: (
              <strong key="host" className="text-ink">
                {displayHost()}
              </strong>
            ),
            code: (
              <strong key="code" className="tracking-[0.06em] text-ink">
                {formatJoinCode(code)}
              </strong>
            ),
          })}
        </p>
        <button
          type="button"
          onClick={() => setInvite(true)}
          aria-label={t('present.invite')}
          className="shrink-0 rounded-lg"
        >
          <QrCode value={joinUrl(code)} size={84} label={joinUrl(code)} />
        </button>
      </header>

      {!session.connected && session.status !== 'connecting' ? (
        <p role="status" className="bg-stamp-soft px-[1.5em] py-[0.4em] font-bold">
          {t('present.reconnecting')}
        </p>
      ) : null}
      {session.status === 'error' && session.errorCode ? (
        <div className="px-[1.5em] pt-[0.6em]">
          <ErrorNotice code={session.errorCode} />
        </div>
      ) : null}

      <main className="flex min-h-0 flex-1 flex-col px-[2em] py-[1.4em]">
        {questions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-[1em] text-center">
            <Stamp size={96} />
            <h1 className="text-[2em] font-extrabold">{t('present.empty.title')}</h1>
            <Link to={`/edit/${id}`} className={buttonClass('primary', 'lg')}>
              {t('present.empty.action')}
            </Link>
          </div>
        ) : active ? (
          <ActiveQuestion question={active} results={results} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Stamp size={120} />
          </div>
        )}
      </main>

      <footer className="flex items-center justify-between gap-[1em] px-[1.5em] py-[0.5em] text-[0.95em]">
        <div className="flex items-center gap-[1.2em] text-muted">
          <span className="flex items-center gap-[0.4em] font-bold text-ink" aria-live="polite">
            <PeopleIcon />
            {tn('present.participants', session.participants)}
          </span>
          {questions.length > 0 && index >= 0 ? (
            <span>{t('present.position', { index: index + 1, total: questions.length })}</span>
          ) : null}
          <span className="hidden lg:inline">{t('present.keys')}</span>
        </div>
        <nav className="flex items-center gap-[0.2em]">
          <ControlButton label={t('present.prev')} onClick={() => go(-1)} disabled={index <= 0}>
            <PrevIcon />
          </ControlButton>
          <ControlButton
            label={t('present.next')}
            onClick={() => go(1)}
            disabled={index === questions.length - 1}
          >
            <NextIcon />
          </ControlButton>
          <ResetButton disabled={!active} onReset={() => active && void session.reset(active.id)} />
          <ControlButton label={t('present.invite')} onClick={() => setInvite(true)}>
            <InviteIcon />
          </ControlButton>
          <ControlButton label={t('present.fullscreen')} onClick={toggleFullscreen}>
            <FullscreenIcon />
          </ControlButton>
          <ControlButton label={t('present.exit')} onClick={() => navigate(`/edit/${id}`)}>
            <ExitIcon />
          </ControlButton>
        </nav>
      </footer>

      {invite ? <Invite code={code} onClose={() => setInvite(false)} /> : null}
    </div>
  );
}
