import { type FormEvent, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { buttonClass } from '../components/Button';
import { Shell } from '../components/Shell';
import { useI18n } from '../i18n/I18nProvider';
import { formatJoinCode } from '../lib/format';
import { forgetMine, listMine, type MyPresentation } from '../lib/my-presentations';

export const SOURCE_URL = 'https://github.com/mftnakrsu/oyla';

function JoinForm() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const id = useId();
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 6) {
      setInvalid(true);
      return;
    }
    navigate(`/join/${digits}`);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <label htmlFor={id} className="sr-only">
        {t('home.join.label')}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={id}
          value={value}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '').slice(0, 6);
            setValue(formatJoinCode(digits));
            setInvalid(false);
          }}
          inputMode="numeric"
          autoComplete="off"
          placeholder="123 456"
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          className="min-h-16 w-full rounded-2xl border-2 border-line bg-paper px-5 text-center text-4xl font-extrabold tracking-[0.12em] placeholder:text-line focus:border-ink focus:outline-none sm:w-72 sm:text-left"
        />
        <button type="submit" className={buttonClass('primary', 'lg', 'min-h-16 sm:px-8')}>
          {t('home.join.submit')}
        </button>
      </div>
      {invalid ? (
        <p id={`${id}-error`} className="font-bold text-stamp">
          {t('home.join.invalid')}
        </p>
      ) : null}
    </form>
  );
}

function MyPresentations() {
  const { t } = useI18n();
  const [items, setItems] = useState<MyPresentation[]>(() => listMine());
  if (items.length === 0) {
    return <p className="text-muted">{t('home.mine.empty')}</p>;
  }
  return (
    <ul className="divide-y-2 divide-line border-y-2 border-line">
      {items.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{item.title}</p>
            <p className="text-sm text-muted">{formatJoinCode(item.joinCode)}</p>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={`/edit/${item.id}#key=${item.adminToken}`}
              className={buttonClass('secondary', 'md', 'min-h-10 px-3')}
            >
              {t('home.mine.open')}
            </a>
            <Link
              to={`/present/${item.id}`}
              className={buttonClass('quiet', 'md', 'min-h-10 px-3')}
            >
              {t('home.mine.present')}
            </Link>
            <button
              type="button"
              aria-label={t('home.mine.forget', { title: item.title })}
              title={t('home.mine.forget', { title: item.title })}
              onClick={() => {
                forgetMine(item.id);
                setItems(listMine());
              }}
              className={buttonClass('quiet', 'md', 'min-h-10 px-3 text-xl text-muted')}
            >
              ×
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function HomePage() {
  const { t } = useI18n();
  return (
    <Shell wide>
      <div className="grid gap-12 md:grid-cols-[1.25fr_1fr] md:gap-16">
        <section aria-labelledby="join-title" className="flex flex-col gap-5 md:pt-6">
          <h1
            id="join-title"
            className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl"
          >
            {t('home.join.title')}
          </h1>
          <JoinForm />
        </section>
        <section
          aria-labelledby="present-title"
          className="flex flex-col gap-4 rounded-3xl bg-paper p-6 sm:p-8"
        >
          <h2 id="present-title" className="text-2xl font-extrabold">
            {t('home.present.title')}
          </h2>
          <p className="text-muted">{t('home.present.body')}</p>
          <div>
            <Link to="/new" className={buttonClass('primary', 'lg')}>
              {t('home.present.create')}
            </Link>
          </div>
          <h3 className="mt-4 text-lg font-extrabold">{t('home.mine.title')}</h3>
          <MyPresentations />
        </section>
      </div>
      <footer className="mt-16 text-sm text-muted">
        {t('home.footer')}{' '}
        <a href={SOURCE_URL} className="font-bold text-ink underline underline-offset-4">
          {t('home.footer.source')}
        </a>
      </footer>
    </Shell>
  );
}
