import type { ErrorCode, PublicQuestion, QuestionTypeKey } from '@oyla/shared';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { buttonClass } from '../components/Button';
import { ErrorNotice } from '../components/ErrorNotice';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Logo } from '../components/Logo';
import { Stamp } from '../components/Stamp';
import { useI18n } from '../i18n/I18nProvider';
import { formatJoinCode } from '../lib/format';
import { useParticipantSession } from '../live/useParticipantSession';
import { getQuestionTypeUi } from '../question-types/registry';

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
      {children}
    </div>
  );
}

function Answer({
  question,
  remaining,
  submit,
  markAnswered,
}: {
  question: PublicQuestion;
  remaining: number;
  submit(
    questionId: string,
    response: unknown,
  ): Promise<{ ok: true } | { ok: false; error: { code: ErrorCode } }>;
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
        <Stamp size={150} label={t('stamp.voted')} press={justAnswered} />
        <h1 ref={thanks} tabIndex={-1} className="mt-4 text-3xl font-extrabold focus:outline-none">
          {t('join.thanks.title')}
        </h1>
        <p className="max-w-xs text-lg text-muted">{t('join.thanks.body')}</p>
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
      </Centered>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <div>
        <p className="mb-2 text-sm font-bold text-muted">
          {t('join.position', { index: question.index + 1, total: question.total })}
        </p>
        <h1 className="text-3xl font-extrabold leading-tight">
          {question.title || t('editor.question.untitled')}
        </h1>
      </div>
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
        <p role="status" className="mt-3 rounded-xl bg-stamp-soft px-4 py-2 text-sm font-bold">
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

        {status === 'ready' && question && session.state ? (
          <Answer
            key={question.id}
            question={question}
            remaining={session.state.remaining}
            submit={session.submit}
            markAnswered={session.markAnswered}
          />
        ) : null}
      </main>
    </div>
  );
}
