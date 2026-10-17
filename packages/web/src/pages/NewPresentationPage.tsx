import { LIMITS } from '@oyla/shared';
import { type FormEvent, useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { api, errorCodeOf } from '../api/client';
import { Button } from '../components/Button';
import { ErrorNotice } from '../components/ErrorNotice';
import { Shell } from '../components/Shell';
import { useI18n } from '../i18n/I18nProvider';
import { saveMine } from '../lib/my-presentations';
import { inputClass } from '../question-types/shared';

export function NewPresentationPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const id = useId();
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ReturnType<typeof errorCodeOf> | null>(null);

  useEffect(() => {
    api
      .config()
      .then((config) => setNeedsPassword(config.createPasswordRequired))
      .catch(() => {});
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.createPresentation({
        title: title.trim(),
        ...(needsPassword ? { password } : {}),
      });
      saveMine({
        id: created.id,
        title: title.trim(),
        joinCode: created.joinCode,
        adminToken: created.adminToken,
        createdAt: Date.now(),
      });
      navigate(`/edit/${created.id}?new=1#key=${created.adminToken}`);
    } catch (caught) {
      const code = errorCodeOf(caught);
      if (code === 'CREATE_PASSWORD_REQUIRED') setNeedsPassword(true);
      setError(code);
      setBusy(false);
    }
  };

  return (
    <Shell>
      <h1 className="mb-8 text-4xl font-extrabold tracking-tight">{t('new.title')}</h1>
      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-title`} className="font-bold">
            {t('new.name.label')}
          </label>
          <input
            id={`${id}-title`}
            className={inputClass}
            value={title}
            maxLength={LIMITS.presentationTitle}
            placeholder={t('new.name.placeholder')}
            required
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        {needsPassword ? (
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-password`} className="font-bold">
              {t('new.password.label')}
            </label>
            <input
              id={`${id}-password`}
              type="password"
              className={inputClass}
              value={password}
              autoComplete="current-password"
              aria-describedby={`${id}-password-hint`}
              onChange={(event) => setPassword(event.target.value)}
            />
            <p id={`${id}-password-hint`} className="text-sm text-muted">
              {t('new.password.hint')}
            </p>
          </div>
        ) : null}
        {error ? <ErrorNotice code={error} /> : null}
        <div>
          <Button type="submit" size="lg" disabled={!title.trim() || busy}>
            {t('new.submit')}
          </Button>
        </div>
      </form>
    </Shell>
  );
}
