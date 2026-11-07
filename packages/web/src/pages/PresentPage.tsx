import {
  type Ack,
  canModerate,
  getQuestionType,
  isScored,
  isTimed,
  type Leaderboard,
  type PresentationDto,
  type QuestionDto,
} from '@oyla/shared';
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
import { usePalette } from '../lib/palette';
import { useCountdown } from '../live/useCountdown';
import { usePresenterSession } from '../live/usePresenterSession';
import { getQuestionTypeUi } from '../question-types/registry';
import { HideButton } from '../question-types/shared';
import {
  ExitIcon,
  EyeIcon,
  EyeOffIcon,
  FullscreenIcon,
  InviteIcon,
  ModerateIcon,
  NextIcon,
  PeopleIcon,
  PrevIcon,
  ResetIcon,
  TrophyIcon,
} from './present/icons';

function ControlButton({
  label,
  onClick,
  disabled,
  armed = false,
  pressed,
  children,
}: {
  label: string;
  onClick(): void;
  disabled?: boolean;
  armed?: boolean;
  /** For toggles: rendered as aria-pressed with a tinted background when on. */
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={`grid h-[2.6em] min-w-[2.6em] place-items-center rounded-xl px-[0.5em] disabled:opacity-30 ${
        armed
          ? 'bg-danger text-on-danger'
          : pressed
            ? 'bg-brand-soft text-ink'
            : 'text-ink hover:bg-ink/5'
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

/** Shown instead of the results while they are hidden: answers keep arriving, only the count shows. */
function HiddenResults({ total, onReveal }: { total: number; onReveal(): void }) {
  const { t, tn } = useI18n();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[1em] text-center">
      <EyeOffIcon className="size-[4em] text-muted" />
      <p className="text-[2em] font-extrabold">{t('present.hidden.title')}</p>
      <p className="text-[1.4em] text-muted" aria-live="polite">
        {tn('results.answers', total)}
      </p>
      <button
        type="button"
        onClick={onReveal}
        className={buttonClass('primary', 'lg', 'mt-[0.5em]')}
      >
        <EyeIcon className="size-[1.2em]" />
        {t('present.showResults')}
      </button>
    </div>
  );
}

/** Above the results while moderating: what to do, how many answers are hidden, and the way out. */
function ModerationBar({
  hidden,
  onShowHidden,
  onDone,
}: {
  hidden: number;
  onShowHidden(): void;
  onDone(): void;
}) {
  const { t, tn } = useI18n();
  return (
    <div className="mb-[1em] flex flex-wrap items-center gap-x-[1.2em] gap-y-[0.5em] rounded-xl bg-brand-soft px-[1em] py-[0.6em]">
      <p className="mr-auto font-bold">{t('present.moderation.hint')}</p>
      {hidden > 0 ? (
        <>
          <span aria-live="polite">{tn('present.moderation.hidden', hidden)}</span>
          <button type="button" onClick={onShowHidden} className={buttonClass('secondary')}>
            {t('present.moderation.restore')}
          </button>
        </>
      ) : null}
      <button type="button" onClick={onDone} className={buttonClass('primary')}>
        {t('present.moderation.done')}
      </button>
    </div>
  );
}

/** While a timed question is open: the countdown and how many answered, never the results. */
function TimedOpen({ left, total }: { left: number; total: number }) {
  const { t, tn } = useI18n();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[0.6em] text-center">
      <p
        className="text-[9em] font-extrabold leading-none tabular-nums"
        role="timer"
        aria-label={t('quiz.timeLeft')}
      >
        {Math.ceil(left / 1000)}
      </p>
      <p className="text-[1.6em] text-muted" aria-live="polite">
        {tn('results.answers', total)}
      </p>
    </div>
  );
}

/** The quiz leaderboard over the whole screen; names can be moderated. */
function LeaderboardView({
  board,
  onHide,
  onClose,
}: {
  board: Leaderboard | null;
  onHide(id: number): void;
  onClose(): void;
}) {
  const { t, tn } = useI18n();
  const [moderating, setModerating] = useState(false);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => close.current?.focus(), []);
  const entries = board?.entries ?? [];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('present.leaderboard')}
      className="fixed inset-0 z-20 flex flex-col bg-page px-[2em] py-[1.5em]"
      style={{ fontSize: 'clamp(15px, 0.85vw + 0.55vh, 32px)' }}
    >
      <div className="mb-[1em] flex flex-wrap items-baseline justify-between gap-[1em]">
        <h1 className="text-[2.7em] font-extrabold tracking-tight">{t('present.leaderboard')}</h1>
        <p className="text-[1.3em] text-muted">
          {tn('present.leaderboard.players', board?.players ?? 0)}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="py-[2em] text-center text-[1.4em] text-muted">
            {t('present.leaderboard.empty')}
          </p>
        ) : (
          <ol className="flex flex-col gap-[0.5em]">
            {entries.map((entry) => (
              <li
                key={`${entry.id}-${entry.rank}-${entry.points}`}
                className={`slip-in flex items-center gap-[1em] rounded-xl border-2 px-[1em] py-[0.5em] text-[1.6em] ${
                  entry.rank === 1 ? 'border-brand bg-brand-soft' : 'border-line bg-paper'
                }`}
              >
                <span className="w-[2em] shrink-0 text-center font-extrabold tabular-nums">
                  {entry.rank}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate font-bold ${entry.name ? '' : 'text-muted'}`}
                >
                  {entry.name ?? t('present.leaderboard.anonymous')}
                </span>
                <span className="shrink-0 tabular-nums text-muted">
                  {t('present.leaderboard.points', { points: entry.points })}
                </span>
                {moderating && entry.name && entry.id > 0 ? (
                  <HideButton text={entry.name} onHide={() => onHide(entry.id)} />
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="mt-[1em] flex justify-end gap-[0.6em]">
        <button
          type="button"
          aria-pressed={moderating}
          onClick={() => setModerating((on) => !on)}
          className={buttonClass('secondary', 'lg')}
        >
          <ModerateIcon />
          {t('present.leaderboard.moderate')}
        </button>
        <button
          ref={close}
          type="button"
          onClick={onClose}
          className={buttonClass('primary', 'lg')}
        >
          {t('present.leaderboard.close')}
        </button>
      </div>
    </div>
  );
}

function ActiveQuestion({
  question,
  results,
  total,
  onReveal,
  onHide,
  left,
}: {
  question: QuestionDto;
  results: unknown;
  total: number;
  onReveal(): void;
  /** Set while moderating. */
  onHide?(key: string): void;
  /** Timed questions: milliseconds left, 0 once closed; null for untimed ones. */
  left: number | null;
}) {
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
        {left !== null && left > 0 ? (
          <TimedOpen left={left} total={total} />
        ) : question.resultsHidden ? (
          <HiddenResults total={total} onReveal={onReveal} />
        ) : readable && results !== null ? (
          <ErrorBoundary key={question.id} fallback={unavailable}>
            <Suspense fallback={null}>
              {left === 0 ? (
                <p className="mb-[0.6em] text-[1.3em] font-bold text-muted">
                  {t('present.timeUp')}
                </p>
              ) : null}
              <ui.Results
                config={question.config}
                results={results}
                onHide={onHide}
                revealed={left === 0}
              />
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
  const [toggleError, setToggleError] = useState<ReturnType<typeof errorCodeOf> | null>(null);
  /** The question being moderated; moving to another question ends moderation. */
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  const session = usePresenterSession(id, token);
  usePalette(session.theme ?? presentation?.theme);
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
  const hasQuiz = questions.some((q) => isScored(q.type));
  const countdown = useCountdown(session.closesAt);
  const left = active && isTimed(active.type) ? (countdown ?? 0) : null;

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

  /** Hides or reveals the active question's results on this screen (and every other one). */
  const toggleHidden = useCallback(() => {
    if (!active || !token) return;
    setToggleError(null);
    api
      .updateQuestion(id, token, active.id, { resultsHidden: !active.resultsHidden })
      .then((updated) =>
        setPresentation((current) =>
          current
            ? {
                ...current,
                questions: current.questions.map((q) => (q.id === updated.id ? updated : q)),
              }
            : current,
        ),
      )
      .catch((error) => setToggleError(errorCodeOf(error)));
  }, [active, id, token]);

  const moderatable = active ? canModerate(active.type) && !active.resultsHidden : false;
  const moderating = moderatable && active !== undefined && moderatingId === active.id;
  const toggleModeration = useCallback(() => {
    if (!active || !moderatable) return;
    setModeratingId((current) => (current === active.id ? null : active.id));
  }, [active, moderatable]);

  /** Runs a moderation command and shows its error, if any. */
  const moderate = useCallback(async (command: Promise<Ack>) => {
    setToggleError(null);
    const ack = await command;
    if (!ack.ok) setToggleError(ack.error.code);
  }, []);

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
      if (showBoard) {
        if (event.key === 'Escape' || event.key === 'l') setShowBoard(false);
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
      } else if (event.key === 'h') {
        toggleHidden();
      } else if (event.key === 'm') {
        toggleModeration();
      } else if (event.key === 'i') {
        setInvite(true);
      } else if (event.key === 'l' && hasQuiz) {
        setShowBoard(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, toggleFullscreen, toggleHidden, toggleModeration, invite, showBoard, hasQuiz]);

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
        <p role="status" className="bg-danger-soft px-[1.5em] py-[0.4em] font-bold">
          {t('present.reconnecting')}
        </p>
      ) : null}
      {session.status === 'error' && session.errorCode ? (
        <div className="px-[1.5em] pt-[0.6em]">
          <ErrorNotice code={session.errorCode} />
        </div>
      ) : toggleError ? (
        <div className="px-[1.5em] pt-[0.6em]">
          <ErrorNotice code={toggleError} />
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
          <>
            {moderating ? (
              <ModerationBar
                hidden={message?.hidden ?? 0}
                onShowHidden={() => void moderate(session.showHidden(active.id))}
                onDone={() => setModeratingId(null)}
              />
            ) : null}
            <ActiveQuestion
              question={active}
              results={results}
              total={message?.total ?? 0}
              onReveal={toggleHidden}
              onHide={
                moderating ? (key) => void moderate(session.hideEntry(active.id, key)) : undefined
              }
              left={left}
            />
          </>
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
            label={active?.resultsHidden ? t('present.showResults') : t('present.hideResults')}
            onClick={toggleHidden}
            disabled={!active}
          >
            {active?.resultsHidden ? <EyeIcon /> : <EyeOffIcon />}
          </ControlButton>
          {active && canModerate(active.type) ? (
            <ControlButton
              label={t('present.moderate')}
              onClick={toggleModeration}
              disabled={!moderatable}
              pressed={moderating}
            >
              <ModerateIcon />
            </ControlButton>
          ) : null}
          {hasQuiz ? (
            <ControlButton label={t('present.leaderboard')} onClick={() => setShowBoard(true)}>
              <TrophyIcon />
            </ControlButton>
          ) : null}
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
      {showBoard ? (
        <LeaderboardView
          board={session.leaderboard}
          onHide={(id) => void moderate(session.hideNickname(id))}
          onClose={() => setShowBoard(false)}
        />
      ) : null}
    </div>
  );
}
