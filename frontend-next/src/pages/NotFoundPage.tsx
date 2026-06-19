import { Link } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="card">
      <h1>404</h1>
      <p className="muted">{t('notFound.title')}</p>
      <Link to="/" className="btnLink">
        {t('notFound.home')}
      </Link>
    </section>
  );
}
