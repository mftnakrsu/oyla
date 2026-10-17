import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Stamp } from './Stamp';

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const { t } = useI18n();
  const large = size === 'lg';
  return (
    <Link to="/" aria-label={t('app.home')} className="inline-flex items-center gap-2 rounded-md">
      <Stamp size={large ? 44 : 30} />
      <span className={`font-extrabold tracking-tight ${large ? 'text-3xl' : 'text-xl'}`}>
        Oyla
      </span>
    </Link>
  );
}
