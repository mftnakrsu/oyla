import { Link } from 'react-router';
import { buttonClass } from '../components/Button';
import { Shell } from '../components/Shell';
import { useI18n } from '../i18n/I18nProvider';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <Shell>
      <h1 className="mb-6 text-4xl font-extrabold">{t('notFound.title')}</h1>
      <Link to="/" className={buttonClass('primary', 'lg')}>
        {t('notFound.action')}
      </Link>
    </Shell>
  );
}
