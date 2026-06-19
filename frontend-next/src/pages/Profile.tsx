import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EditIcon from '../assets/icons/edit.svg?react';
import { useAuth } from '../../context/AuthContext';
import ProfileIcon from '../assets/icons/profile.svg?react';
import { profileService, type ActivityItem } from '../../services/profileService';
import { useTranslation } from '../../context/LanguageContext';
import type { TranslationKey } from '../../i18n';
import styles from '../styles/Profile.module.css';

const PAGE_SIZE = 3;

const ACTIVITY_TITLE_KEYS: Record<string, TranslationKey> = {
  PET_REGISTERED: 'activity.petRegistered',
  PET_UPDATED: 'activity.petUpdated',
  HEALTH_RECORD_CREATED: 'activity.healthRecordCreated',
  HEALTH_RECORD_UPDATED: 'activity.healthRecordUpdated',
  RECOMMENDATION_CREATED: 'activity.recommendationCreated',
  RECOMMENDATION_UPDATED: 'activity.recommendationUpdated',
  PROFILE_UPDATED: 'activity.profileUpdated',
  PET_FAVORITE_ADDED: 'activity.petFavoriteAdded',
  PET_FAVORITE_REMOVED: 'activity.petFavoriteRemoved',
};

function activityTitleKey(eventType: string): TranslationKey {
  return ACTIVITY_TITLE_KEYS[eventType] ?? 'activity.unknown';
}

export const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, locale } = useTranslation();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityPage, setActivityPage] = useState(0);
  const [hasMoreActivity, setHasMoreActivity] = useState(false);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState('');

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

  const loadActivityPage = useCallback(async (page: number, append: boolean) => {
    setActivityLoading(true);
    setActivityError('');
    try {
      const data = await profileService.getActivity(page, PAGE_SIZE);
      setActivities((prev) => (append ? [...prev, ...data.items] : data.items));
      setActivityPage(page + 1);
      setHasMoreActivity(page + 1 < data.totalPages);
    } catch {
      if (!append) {
        setActivities([]);
      }
      setActivityError(t('profile.activityLoadError'));
    } finally {
      setActivityLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadActivityPage(0, false);
  }, [loadActivityPage]);

  const fullName = `${firstName || user?.firstName || ''} ${lastName || user?.lastName || ''}`.trim();
  const email = user?.email ?? '';

  const dateLocale = locale === 'kz' ? 'kk-KZ' : locale === 'en' ? 'en-US' : 'ru-RU';

  const formatBirthDate = (value: string) => {
    if (!value) return t('common.notSpecified');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatActivityDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const display = (value: string) => value || t('common.notSpecified');

  const handleShowMore = () => {
    if (activityLoading || !hasMoreActivity) return;
    loadActivityPage(activityPage, true);
  };

  return (
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

            {activityLoading && activities.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
                {t('common.loading')}
              </p>
            )}

            {activityError && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
                {activityError}
              </p>
            )}

            {!activityLoading && !activityError && activities.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
                {t('profile.activityEmpty')}
              </p>
            )}

            {activities.map((item) => (
              <div key={item.id} className={styles.activityItem}>
                <span className={styles.activityDate}>{formatActivityDate(item.createdAt)}</span>
                <div className={styles.activityContent}>
                  <p className={styles.activityName}>{t(activityTitleKey(item.eventType))}</p>
                  {item.description && (
                    <p className={styles.activityDesc}>{item.description}</p>
                  )}
                </div>
              </div>
            ))}

            {hasMoreActivity && (
              <button
                className={styles.showMoreBtn}
                onClick={handleShowMore}
                disabled={activityLoading}
                type="button"
              >
                {activityLoading ? t('common.loading') : t('common.showMore')}
              </button>
            )}
          </div>
        </div>
  );
};