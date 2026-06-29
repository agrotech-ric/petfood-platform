import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdChevronLeft, MdPerson} from 'react-icons/md';
import DeleteIcon from '../assets/icons/delete.svg?react';
import EditIcon from '../assets/icons/edit1.svg?react';
import DateIcon from '../assets/icons/date.svg?react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import styles from '../styles/EditProfile.module.css';

const COUNTRIES = ['Казахстан', 'Россия', 'Узбекистан', 'Кыргызстан', 'Беларусь'];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

export const EditProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/settings';
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savedAvatarObjectKey, setSavedAvatarObjectKey] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

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
          setSavedAvatarObjectKey(data.avatarUrl);
          const downloadUrl = await profileService.getAvatarDownloadUrl(data.avatarUrl);
          if (downloadUrl) setAvatarPreview(downloadUrl);
        }
      } catch (err: any) {
        setFetchError(err.message || 'Произошла ошибка при загрузке профиля');
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, avatar: 'Формат JPEG или PNG' }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: 'Максимум 10 МБ' }));
      return;
    }

    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarRemoved(false);
    setErrors((prev) => {
      const { avatar, ...rest } = prev;
      return rest;
    });
  };

  const handleAvatarDelete = () => {
    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = 'Введите имя';
    if (!lastName.trim()) next.lastName = 'Введите фамилию';
    if (!birthDate.trim()) next.birthDate = 'Укажите дату рождения';
    if (!city.trim()) next.city = 'Введите город';

    const phoneRegex = /^\+?[0-9\s-]{7,20}$/;
    if (!phone.trim()) {
      next.phone = 'Введите номер телефона';
    } else if (!phoneRegex.test(phone)) {
      next.phone = 'Неверный формат номера';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    setFetchError('');

    try {
      const payload: Record<string, unknown> = {
        firstName,
        lastName,
        phone,
        birthDate,
        country,
        city,
      };

      if (avatarRemoved) {
        payload.avatarUrl = '';
      } else if (avatarFile) {
        payload.avatarUrl = await profileService.uploadAvatar(avatarFile);
      }

      await profileService.updateProfile(payload);
      navigate(returnTo);
    } catch (err: any) {
      setFetchError(err.message || 'Произошла ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(returnTo);
  };

  return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={handleCancel}>
            <MdChevronLeft size={16} />
            Назад
          </button>
          <h1 className={styles.headerTitle}>Редактирование профиля</h1>
        </header>

        {initialLoading && <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '0 0 12px' }}>Загрузка...</p>}
        {fetchError && <p className={styles.errorText}>{fetchError}</p>}

        <div className={styles.card}>
          <div className={styles.avatarBlock}>
            <div className={styles.avatarFrame}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Аватар" className={styles.avatarPhoto} />
              ) : (
                <MdPerson size={80} className={styles.avatarIcon} />
              )}
            </div>
            <div className={styles.avatarToolbar}>
              <button
                type="button"
                className={styles.avatarActionBtn}
                onClick={handleAvatarPick}
                title="Изменить фото"
              >
                <EditIcon width={20} height={20} />
              </button>
              <button
                type="button"
                className={`${styles.avatarActionBtn} ${styles.danger}`}
                onClick={handleAvatarDelete}
                title="Удалить фото"
                disabled={!avatarPreview && !savedAvatarObjectKey}
              >
                <DeleteIcon width={20} height={20} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className={styles.hiddenInput}
              onChange={handleAvatarChange}
            />
            {errors.avatar && <p className={styles.errorText}>{errors.avatar}</p>}
          </div>

          <div className={styles.form}>
            <div>
              <p className={styles.fieldLabel}>Имя</p>
              <input
                className={`${styles.inputField} ${errors.firstName ? styles.inputError : ''}`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {errors.firstName && <p className={styles.errorText}>{errors.firstName}</p>}
            </div>

            <div>
              <p className={styles.fieldLabel}>Фамилия</p>
              <input
                className={`${styles.inputField} ${errors.lastName ? styles.inputError : ''}`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              {errors.lastName && <p className={styles.errorText}>{errors.lastName}</p>}
            </div>

            <div>
              <p className={styles.fieldLabel}>Дата рождения</p>
              <div className={styles.dateInputWrapper}>
                <input
                  type="date"
                  className={`${styles.inputField} ${errors.birthDate ? styles.inputError : ''}`}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              {errors.birthDate && <p className={styles.errorText}>{errors.birthDate}</p>}
            </div>

            <div>
              <p className={styles.fieldLabel}>Страна</p>
              <select
                className={styles.selectField}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Не указано</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className={styles.fieldLabel}>Город</p>
              <input
                className={`${styles.inputField} ${errors.city ? styles.inputError : ''}`}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              {errors.city && <p className={styles.errorText}>{errors.city}</p>}
            </div>

            <div>
              <p className={styles.fieldLabel}>Телефон</p>
              <input
                className={`${styles.inputField} ${errors.phone ? styles.inputError : ''}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 777 77 7777"
              />
              {errors.phone && <p className={styles.errorText}>{errors.phone}</p>}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button className={styles.cancelBtn} onClick={handleCancel}>
            Отмена
          </button>
        </div>
      </div>
  );
};
