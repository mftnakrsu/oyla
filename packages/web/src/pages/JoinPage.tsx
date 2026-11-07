import {
  type ErrorCode,
  isSharedOnPhones,
  type PublicQuestion,
  type QuestionTypeKey,
  type ResultsMessage,
} from '@oyla/shared';
import { type ReactNode, Suspense, useEffect, useRef, useState } from 'react';
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
import { useParticipantSession } from '../live/useParticipantSession';
import { getQuestionTypeUi } from '../question-types/registry';

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
      <h2 id="phone-results" className="text-base font-extrabold">
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
      <p className="mb-2 text-sm font-bold text-muted">
        {t('join.position', { index: question.index + 1, total: question.total })}
      </p>
      <h1 className="text-3xl font-extrabold leading-tight">
        {question.title || t('editor.question.untitled')}
      </h1>
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
        <h1 ref={thanks} tabIndex={-1} className="mt-4 text-3xl font-extrabold focus:outline-none">
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
        <p className="truncate border-b-2 border-line pb-3 font-bold text-muted">{session.title}</p>
      ) : null}
      {status === 'ready' && !session.connected ? (
        <p role="status" className="mt-3 rounded-xl bg-danger-soft px-4 py-2 text-sm font-bold">
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
            <h1 className="text-3xl font-extrabold">{t('join.notFound.title')}</h1>
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
            <h1 className="text-3xl font-extrabold">{t('join.ended.title')}</h1>
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

        {status === 'ready' && !question ? (
          <Centered>
            <Stamp size={72} className="opacity-90" />
            <h1 className="text-3xl font-extrabold">{t('join.waiting.title')}</h1>
            <p className="max-w-xs text-lg text-muted">{t('join.waiting.body')}</p>
          </Centered>
        ) : null}

        {status === 'ready' && question && session.state && isSharedOnPhones(question.type) ? (
          <SharedAnswer
            key={question.id}
            question={question}
            remaining={session.state.remaining}
            results={session.state.results}
            mine={session.state.mine ?? []}
            submit={session.submit}
          />
        ) : null}

        {status === 'ready' && question && session.state && !isSharedOnPhones(question.type) ? (
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
