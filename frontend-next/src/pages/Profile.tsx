import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EditIcon from '../assets/icons/edit.svg?react';
import { useAuth } from '../../context/AuthContext';
import ProfileIcon from '../assets/icons/profile.svg?react';
import { profileService } from '../../services/profileService';
import { useTranslation } from '../../context/LanguageContext';
import { Sidebar } from '../components/sidebar/Sidebar';
import styles from '../styles/Profile.module.css';

type ActivityItem = {
  id: string;
  date: string;
  title: string;
  description: string;
};

const ACTIVITY_HISTORY: ActivityItem[] = [
  {
    id: '1',
    date: '24.01.2026',
    title: 'Добавление питомца',
    description:
      'Лаки / 12 лет / Немецкая овчарка / Активный / Служебная собака, работает в региональной полиции Казахстана и ...',
  },
  {
    id: '2',
    date: '13.01.2026',
    title: 'Редактирование корма',
    description:
      'Пауч Royal Canine для щенков с курицей / коммерческий / влажный / для щенков / корм подходит при симптомах ...',
  },
  {
    id: '3',
    date: '09.01.2026',
    title: 'Редактирование профиля питомца',
    description: 'Алекс / 1 год / Золотой ретривер / Пасивный / живет на территории частного дома',
  },
  {
    id: '4',
    date: '02.01.2026',
    title: 'Добавление питомца',
    description: 'Алекс / 1 год / Золотой ретривер / Активный / живет на территории частного дома',
  },
  {
    id: '5',
    date: '28.12.2025',
    title: 'Создание рекомендации',
    description:
      'Рекомендация по корму для Лаки / на основе анализа состояния здоровья и возраста питомца ...',
  },
];

const PAGE_SIZE = 3;

export const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await profileService.getProfile();

        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setPhone(data.phone ?? '');
        setBirthDate(data.birthDate ?? '');
        setCountry(data.country ?? '');
        setCity(data.city ?? '');

        if (data.avatarUrl) {
          const downloadUrl = await profileService.getAvatarDownloadUrl(data.avatarUrl);
          if (downloadUrl) setAvatarPreview(downloadUrl);
        }
      } catch {
        // профиль не загрузился — оставляем значения по умолчанию
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const fullName = `${firstName || user?.firstName || ''} ${lastName || user?.lastName || ''}`.trim();
  const email = user?.email ?? 'user26@gmail.com';

  const formatBirthDate = (value: string) => {
    if (!value) return t('common.notSpecified');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const dateLocale = locale === 'kz' ? 'kk-KZ' : locale === 'en' ? 'en-US' : 'ru-RU';
    return date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const display = (value: string) => value || t('common.notSpecified');

  const visibleActivity = ACTIVITY_HISTORY.slice(0, visibleCount);
  const hasMore = visibleCount < ACTIVITY_HISTORY.length;

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, ACTIVITY_HISTORY.length));
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.page}>
          <header className={styles.header}>
            <div className={styles.headerSpacer} />
            <h1 className={styles.headerTitle}>{t('profile.title')}</h1>
            <button
              className={styles.editBtn}
              onClick={() => navigate('/settings/edit-profile', { state: { returnTo: '/profile' } })}
            >
              <EditIcon size={16} />
              {t('common.edit')}
            </button>
          </header>

          {loading && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '0 0 12px' }}>
              {t('common.loading')}
            </p>
          )}

          <div className={styles.card}>
            <div className={styles.avatarFrame}>
              {avatarPreview ? (
                <img src={avatarPreview} alt={t('profile.avatarAlt')} className={styles.avatarPhoto} />
              ) : (
                <ProfileIcon className={styles.avatarIcon} width={96} height={96} />
              )}
            </div>

            <div className={styles.infoBlock}>
              <h2 className={styles.fullName}>{fullName}</h2>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>e-mail</span>
                <span className={styles.infoValue}>{email}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{t('profile.phone')}</span>
                <span className={styles.infoValue}>{display(phone)}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{t('profile.birthDate')}</span>
                <span className={styles.infoValue}>{formatBirthDate(birthDate)}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{t('profile.country')}</span>
                <span className={styles.infoValue}>{display(country)}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{t('profile.city')}</span>
                <span className={styles.infoValue}>{display(city)}</span>
              </div>
            </div>
          </div>

          <div className={styles.activityCard}>
            <h3 className={styles.activityTitle}>{t('profile.activityHistory')}</h3>

            {visibleActivity.map((item) => (
              <div key={item.id} className={styles.activityItem}>
                <span className={styles.activityDate}>{item.date}</span>
                <div className={styles.activityContent}>
                  <p className={styles.activityName}>{item.title}</p>
                  <p className={styles.activityDesc}>{item.description}</p>
                </div>
              </div>
            ))}

            {hasMore && (
              <button className={styles.showMoreBtn} onClick={handleShowMore}>
                {t('common.showMore')}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};