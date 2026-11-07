import {
  type ErrorCode,
  isSharedOnPhones,
  isTimed,
  LIMITS,
  type PublicQuestion,
  type QuestionTypeKey,
  type QuizPublicConfig,
  type ResultsMessage,
  type ScoreSummary,
} from '@oyla/shared';
import { type ReactNode, Suspense, useEffect, useId, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { buttonClass } from '../components/Button';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ErrorNotice } from '../components/ErrorNotice';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Logo } from '../components/Logo';
import { Stamp } from '../components/Stamp';
import { useI18n } from '../i18n/I18nProvider';
import { formatJoinCode } from '../lib/format';
import { usePalette } from '../lib/palette';
import { useCountdown } from '../live/useCountdown';
import { useParticipantSession } from '../live/useParticipantSession';
import { getQuestionTypeUi } from '../question-types/registry';
import { inputClass } from '../question-types/shared';

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
      {children}
    </div>
  );
}

/** The live chart under the "voted" stamp, when the presenter shares results with phones. */
function PhoneResults({
  question,
  message,
}: {
  question: PublicQuestion;
  message: ResultsMessage;
}) {
  const { t } = useI18n();
  const ui = getQuestionTypeUi(question.type as QuestionTypeKey);
  if (message.results === null) return null;
  return (
    <section
      aria-labelledby="phone-results"
      className="mt-2 flex w-full flex-col gap-3 rounded-2xl bg-paper p-4 text-left text-sm"
    >
      <h2 id="phone-results" className="text-base font-semibold">
        {t('join.results.title')}
      </h2>
      {/* The word cloud lays itself out in the space it gets; the other types size to fit. */}
      <div className={question.type === 'word-cloud' ? 'h-64' : undefined}>
        <ErrorBoundary key={question.id} fallback={null}>
          <Suspense fallback={null}>
            <ui.Results config={question.config} results={message.results} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </section>
  );
}

type Submit = (
  questionId: string,
  response: unknown,
) => Promise<{ ok: true } | { ok: false; error: { code: ErrorCode } }>;

function QuestionHeading({ question }: { question: PublicQuestion }) {
  const { t } = useI18n();
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-muted">
        {t('join.position', { index: question.index + 1, total: question.total })}
      </p>
      <h1 className="text-3xl font-semibold leading-tight">
        {question.title || t('editor.question.untitled')}
      </h1>
    </div>
  );
}

/** A random "Quick Eagle" in the current language. */
function suggestNickname(adjectives: string, animals: string): string {
  const pick = (list: string) => {
    const words = list.split(',');
    return words[Math.floor(Math.random() * words.length)] ?? '';
  };
  return `${pick(adjectives)} ${pick(animals)}`.trim();
}

/** Asked once per presentation with a quiz, before anything else; a suggestion is ready. */
function NicknameForm({
  onSubmit,
}: {
  onSubmit(nickname: string): Promise<{ ok: true } | { ok: false; error: { code: ErrorCode } }>;
}) {
  const { t } = useI18n();
  const id = useId();
  const suggest = () => suggestNickname(t('nickname.adjectives'), t('nickname.animals'));
  const [name, setName] = useState(suggest);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);
  return (
    <form
      className="flex flex-col gap-5 py-6"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim() || busy) return;
        setBusy(true);
        setError(null);
        const ack = await onSubmit(name);
        setBusy(false);
        if (!ack.ok) setError(ack.error.code);
      }}
    >
      <div>
        <h1 className="text-3xl font-semibold leading-tight">{t('nickname.title')}</h1>
        <p className="mt-2 text-lg text-muted">{t('nickname.body')}</p>
      </div>
      {error ? <ErrorNotice code={error} /> : null}
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="font-medium">
          {t('nickname.label')}
        </label>
        <div className="flex gap-2">
          <input
            id={id}
            className={inputClass}
            value={name}
            maxLength={LIMITS.nickname}
            autoComplete="nickname"
            onChange={(event) => setName(event.target.value)}
          />
          <button
            type="button"
            className={buttonClass('secondary', 'lg', 'shrink-0')}
            onClick={() => setName(suggest())}
          >
            {t('nickname.shuffle')}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={!name.trim() || busy}
        className={buttonClass('primary', 'lg', 'w-full')}
      >
        {t('nickname.submit')}
      </button>
    </form>
  );
}

/** Seconds left as a number and a shrinking bar. */
function Countdown({ left, total }: { left: number; total: number }) {
  const { t } = useI18n();
  const seconds = Math.ceil(left / 1000);
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label={t('quiz.timeLeft')}
        aria-valuemin={0}
        aria-valuemax={Math.round(total / 1000)}
        aria-valuenow={seconds}
        className="h-3 flex-1 overflow-hidden rounded-full bg-line"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-200 ease-linear ${
            seconds <= 5 ? 'bg-danger' : 'bg-brand'
          }`}
          style={{ width: `${total > 0 ? (left / total) * 100 : 0}%` }}
        />
      </div>
      <span className="min-w-12 text-right text-2xl font-semibold tabular-nums">
        {t('quiz.secondsLeft', { count: seconds })}
      </span>
    </div>
  );
}

/** After the time is up: right or wrong, the answer, points and place. */
function QuizReveal({
  question,
  score,
}: {
  question: PublicQuestion;
  score: ScoreSummary | undefined;
}) {
  const { t } = useI18n();
  const config = question.config as QuizPublicConfig;
  const index = config.options.findIndex((option) => option.id === config.correctOptionId);
  const answer = config.options[index];
  const answerLabel = answer?.label || t('mc.option.placeholder', { n: index + 1 });
  const points = score?.points ?? null;
  const title =
    points === null
      ? t('quiz.missed.title')
      : points > 0
        ? t('quiz.right.title')
        : t('quiz.wrong.title');
  return (
    <Centered>
      {points !== null && points > 0 ? <Stamp size={110} press /> : null}
      <h1 tabIndex={-1} className="text-3xl font-semibold">
        {title}
      </h1>
      {points === null ? <p className="text-lg text-muted">{t('quiz.missed.body')}</p> : null}
      {answer ? (
        <p className="text-xl font-medium">{t('quiz.answer', { answer: answerLabel })}</p>
      ) : null}
      {score ? (
        <div className="mt-2 flex w-full flex-col gap-1 rounded-2xl bg-paper p-4 text-lg">
          {points !== null ? (
            <p className="text-2xl font-semibold">{t('quiz.points', { points })}</p>
          ) : null}
          <p>{t('quiz.total', { points: score.total })}</p>
          {score.rank !== null ? (
            <p className="text-muted">
              {t('quiz.rank', { rank: score.rank, players: score.players })}
            </p>
          ) : null}
        </div>
      ) : null}
    </Centered>
  );
}

/** Timed questions (quiz): a countdown, one tap to answer, then the reveal from the server. */
function TimedAnswer({
  question,
  remaining,
  closesAt,
  score,
  submit,
  markAnswered,
}: {
  question: PublicQuestion;
  remaining: number;
  closesAt: number | null;
  score: ScoreSummary | undefined;
  submit: Submit;
  markAnswered(questionId: string): void;
}) {
  const { t } = useI18n();
  const [error, setError] = useState<ErrorCode | null>(null);
  const left = useCountdown(closesAt) ?? 0;
  const ui = getQuestionTypeUi(question.type as QuestionTypeKey);
  const total = ((question.config as { seconds?: number }).seconds ?? 0) * 1000;

  // The server says it's closed (and sends the answer); until then the local clock may be ahead.
  if (question.closesIn === 0) return <QuizReveal question={question} score={score} />;
  if (left === 0 || remaining === 0) {
    return (
      <Centered>
        {left > 0 ? (
          <div className="w-full">
            <Countdown left={left} total={total} />
          </div>
        ) : null}
        {remaining === 0 ? <Stamp size={110} label={t('stamp.voted')} press /> : null}
        <h1 className="text-3xl font-semibold">
          {remaining === 0 ? t('quiz.locked.title') : t('quiz.missed.title')}
        </h1>
        <p className="max-w-xs text-lg text-muted">{t('quiz.locked.body')}</p>
      </Centered>
    );
  }
  return (
    <div className="flex flex-col gap-6 py-6">
      <Countdown left={left} total={total} />
      <QuestionHeading question={question} />
      {error ? <ErrorNotice code={error} /> : null}
      <ui.Respond
        config={question.config}
        remaining={remaining}
        onSubmit={async (response) => {
          setError(null);
          const ack = await submit(question.id, response);
          if (ack.ok) return true;
          if (ack.error.code === 'RESPONSE_LIMIT_REACHED') markAnswered(question.id);
          else setError(ack.error.code);
          return false;
        }}
      />
    </div>
  );
}

/**
 * For types shared on phones (Q&A): the form stays open with everyone's answers under it, since
 * people keep reacting to them. There is no "thanks" screen.
 */
function SharedAnswer({
  question,
  remaining,
  results,
  mine,
  submit,
}: {
  question: PublicQuestion;
  remaining: number;
  results: ResultsMessage | null;
  mine: unknown[];
  submit: Submit;
}) {
  const [error, setError] = useState<ErrorCode | null>(null);
  const ui = getQuestionTypeUi(question.type as QuestionTypeKey);
  return (
    <div className="flex flex-col gap-6 py-6">
      <QuestionHeading question={question} />
      {error ? <ErrorNotice code={error} /> : null}
      <ui.Respond
        config={question.config}
        remaining={remaining}
        results={results?.results ?? null}
        mine={mine}
        onSubmit={async (response) => {
          setError(null);
          const ack = await submit(question.id, response);
          if (!ack.ok) setError(ack.error.code);
          return ack.ok;
        }}
      />
    </div>
  );
}

function Answer({
  question,
  remaining,
  results,
  submit,
  markAnswered,
}: {
  question: PublicQuestion;
  remaining: number;
  results: ResultsMessage | null;
  submit: Submit;
  markAnswered(questionId: string): void;
}) {
  const { t, tn } = useI18n();
  const [answering, setAnswering] = useState(remaining > 0);
  const [justAnswered, setJustAnswered] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);
  const ui = getQuestionTypeUi(question.type as QuestionTypeKey);
  const thanks = useRef<HTMLHeadingElement>(null);

  // Move focus to the confirmation so screen readers announce it.
  useEffect(() => {
    if (!answering && justAnswered) thanks.current?.focus();
  }, [answering, justAnswered]);

  // Out of answers → thanks screen; answers given back (the presenter reset results) → form again.
  const previous = useRef(remaining);
  useEffect(() => {
    if (remaining === 0) setAnswering(false);
    else if (remaining > previous.current) setAnswering(true);
    previous.current = remaining;
  }, [remaining]);

  if (!answering) {
    return (
      <Centered>
        <Stamp size={results ? 96 : 150} label={t('stamp.voted')} press={justAnswered} />
        <h1 ref={thanks} tabIndex={-1} className="mt-4 text-3xl font-semibold focus:outline-none">
          {t('join.thanks.title')}
        </h1>
        <p className="max-w-xs text-lg text-muted">
          {results ? t('join.thanks.bodyResults') : t('join.thanks.body')}
        </p>
        {remaining > 0 ? (
          <button
            type="button"
            className={buttonClass('secondary', 'lg', 'mt-2')}
            onClick={() => {
              setJustAnswered(false);
              setAnswering(true);
            }}
          >
            {tn('join.thanks.again', remaining)}
          </button>
        ) : null}
        {results ? <PhoneResults question={question} message={results} /> : null}
      </Centered>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <QuestionHeading question={question} />
      {error ? <ErrorNotice code={error} /> : null}
      <ui.Respond
        config={question.config}
        remaining={remaining}
        onSubmit={async (response) => {
          setError(null);
          const ack = await submit(question.id, response);
          if (ack.ok) {
            setJustAnswered(true);
            setAnswering(false);
            return true;
          }
          if (ack.error.code === 'RESPONSE_LIMIT_REACHED') {
            // Answered already (another tab, or an earlier attempt whose reply got lost).
            markAnswered(question.id);
            setAnswering(false);
            return false;
          }
          setError(ack.error.code);
          return false;
        }}
      />
    </div>
  );
}

export function JoinPage() {
  const { code = '' } = useParams();
  const { t } = useI18n();
  const valid = /^\d{6}$/.test(code);
  const session = useParticipantSession(valid ? code : null);
  usePalette(session.theme);
  const status = valid ? session.status : 'not-found';
  const question = session.state?.activeQuestion ?? null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8">
      <header className="flex items-center justify-between gap-3 py-4">
        <Logo />
        <LanguageSwitcher />
      </header>
      {status === 'ready' && session.title ? (
        <div className="flex items-baseline justify-between gap-3 border-b-2 border-line pb-3">
          <p className="truncate font-medium text-muted">{session.title}</p>
          {session.state?.nickname ? (
            <p className="shrink-0 truncate text-sm text-muted">
              {t('nickname.playingAs', { name: session.state.nickname })}
            </p>
          ) : null}
        </div>
      ) : null}
      {status === 'ready' && !session.connected ? (
        <p role="status" className="mt-3 rounded-xl bg-danger-soft px-4 py-2 text-sm font-medium">
          {t('join.reconnecting')}
        </p>
      ) : null}

      <main className="flex flex-1 flex-col">
        {status === 'connecting' ? (
          <Centered>
            <p className="text-lg text-muted">{t('join.connecting')}</p>
          </Centered>
        ) : null}

        {status === 'not-found' ? (
          <Centered>
            <h1 className="text-3xl font-semibold">{t('join.notFound.title')}</h1>
            <p className="text-lg text-muted">
              {t('join.notFound.body', { code: formatJoinCode(code) })}
            </p>
            <Link to="/" className={buttonClass('primary', 'lg', 'mt-2')}>
              {t('join.notFound.action')}
            </Link>
          </Centered>
        ) : null}

        {status === 'ended' ? (
          <Centered>
            <Stamp size={96} />
            <h1 className="text-3xl font-semibold">{t('join.ended.title')}</h1>
            <p className="text-lg text-muted">{t('join.ended.body')}</p>
          </Centered>
        ) : null}

        {status === 'error' && session.errorCode ? (
          <Centered>
            <ErrorNotice code={session.errorCode}>
              <button
                type="button"
                className={buttonClass('secondary', 'md', 'mt-3')}
                onClick={() => window.location.reload()}
              >
                {t('common.retry')}
              </button>
            </ErrorNotice>
          </Centered>
        ) : null}

        {status === 'ready' && session.state?.askNickname ? (
          <NicknameForm onSubmit={session.setNickname} />
        ) : null}

        {status === 'ready' && !session.state?.askNickname && !question ? (
          <Centered>
            <Stamp size={72} className="opacity-90" />
            <h1 className="text-3xl font-semibold">{t('join.waiting.title')}</h1>
            <p className="max-w-xs text-lg text-muted">{t('join.waiting.body')}</p>
          </Centered>
        ) : null}

        {status === 'ready' &&
        question &&
        session.state &&
        !session.state.askNickname &&
        isTimed(question.type) ? (
          <TimedAnswer
            key={question.id}
            question={question}
            remaining={session.state.remaining}
            closesAt={session.closesAt}
            score={session.state.score}
            submit={session.submit}
            markAnswered={session.markAnswered}
          />
        ) : null}

        {status === 'ready' &&
        question &&
        session.state &&
        !session.state.askNickname &&
        isSharedOnPhones(question.type) ? (
          <SharedAnswer
            key={question.id}
            question={question}
            remaining={session.state.remaining}
            results={session.state.results}
            mine={session.state.mine ?? []}
            submit={session.submit}
          />
        ) : null}

        {status === 'ready' &&
        question &&
        session.state &&
        !session.state.askNickname &&
        !isSharedOnPhones(question.type) &&
        !isTimed(question.type) ? (
          <Answer
            key={question.id}
            question={question}
            remaining={session.state.remaining}
            results={session.state.results}
            submit={session.submit}
            markAnswered={session.markAnswered}
          />
        ) : null}
      </main>
    </div>
  );
}
