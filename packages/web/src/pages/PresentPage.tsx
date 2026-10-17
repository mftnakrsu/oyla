import { getQuestionType, type PresentationDto, type QuestionDto } from '@oyla/shared';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api, errorCodeOf } from '../api/client';
import { buttonClass } from '../components/Button';
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
  children,
}: {
  label: string;
  onClick(): void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-[2.6em] place-items-center rounded-xl text-ink hover:bg-ink/5 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Invite({ code, onClose }: { code: string; onClose(): void }) {
  const { t, tRich } = useI18n();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('present.invite')}
      className="fixed inset-0 z-20 grid place-items-center bg-page/95 p-[2em]"
    >
      <div className="flex flex-col items-center gap-[1.5em] text-center">
        <p className="text-[2em] font-bold text-muted">
          {tRich('present.join', {
            host: (
              <strong key="host" className="text-ink">
                {displayHost()}
              </strong>
            ),
            code: <span key="code">…</span>,
          }).slice(0, 2)}
        </p>
        <p className="text-[7em] font-extrabold leading-none tracking-[0.08em]">
          {formatJoinCode(code)}
        </p>
        <QrCode value={joinUrl(code)} size={300} label={joinUrl(code)} />
        <button type="button" onClick={onClose} className={buttonClass('secondary', 'lg')}>
          {t('present.inviteClose')}
        </button>
      </div>
    </div>
  );
}

function ActiveQuestion({ question, results }: { question: QuestionDto; results: unknown }) {
  const { t } = useI18n();
  const ui = getQuestionTypeUi(question.type);
  return (
    <>
      <h1 className="mb-[0.8em] text-[2.7em] font-extrabold leading-[1.1] tracking-tight text-balance">
        {question.title || t('editor.question.untitled')}
      </h1>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ui.Results config={question.config} results={results} />
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
      .then(setPresentation)
      .catch((error) => setLoadError(errorCodeOf(error)));
  }, [id, token]);

  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);

  const questions = presentation?.questions ?? [];
  const index = questions.findIndex((q) => q.id === session.activeQuestionId);
  const active = questions[index];

  // The question list changed in another tab: fetch it again.
  useEffect(() => {
    if (presentation && session.activeQuestionId && index === -1) load();
  }, [presentation, session.activeQuestionId, index, load]);

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
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select'))
        return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault();
        go(1);
      } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        go(-1);
      } else if (event.key === 'f') {
        toggleFullscreen();
      } else if (event.key === 'i') {
        setInvite((open) => !open);
      } else if (event.key === 'Escape') {
        setInvite(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, toggleFullscreen]);

  if (!token || session.status === 'unauthorized' || loadError === 'UNAUTHORIZED') {
    return (
      <Shell>
        <h1 className="mb-4 text-3xl font-extrabold">{t('editor.missingKey.title')}</h1>
        <p className="text-lg text-muted">{t('editor.missingKey.body')}</p>
      </Shell>
    );
  }
  if (session.status === 'ended' || loadError === 'NOT_FOUND') {
    return (
      <Shell>
        <h1 className="text-3xl font-extrabold">{t('error.NOT_FOUND')}</h1>
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

  const code = presentation.joinCode;
  const message = active ? session.results[active.id] : undefined;
  const results = active
    ? (message?.results ?? getQuestionType(active.type).aggregate(active.config, []))
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
          <ControlButton
            label={t('present.reset')}
            onClick={() => active && void session.reset(active.id)}
            disabled={!active}
          >
            <ResetIcon />
          </ControlButton>
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
