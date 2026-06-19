import { useState, type ComponentType, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdChevronRight,
  MdDarkMode,
  MdLightMode,
  MdLogout,
} from 'react-icons/md';
import LockIcon from '../assets/icons/lock.svg?react';
import ProifileIcon from '../assets/icons/profile.svg?react';
import DeleteIcon from '../assets/icons/delete.svg?react';
import ThemeIcon from '../assets/icons/theme.svg?react';
import LanguageIcon from '../assets/icons/language.svg?react';
import HelpIcon from '../assets/icons/help.svg?react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import type { Locale } from '../../i18n';
import LanguageModal from '../components/settings/LanguageModal';
import DeleteAccountModal from '../components/settings/DeleteAccountModal';
import ChangeCredentialsModal from '../components/settings/ChangeCredentialsModal';
import ChangeLoginModal from '../components/settings/ChangeLoginModal';
import ChangePasswordModal from '../components/settings/ChangePasswordModal';
import { Sidebar } from '../components/sidebar/Sidebar';
import styles from '../styles/Settings.module.css';

type SettingsItemProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick?: () => void;
  trailing?: ReactNode;
  danger?: boolean;
};

const SettingsItem = ({
  icon: Icon,
  title,
  description,
  onClick,
  trailing,
  danger = false,
}: SettingsItemProps) => (
  <button className={styles.item} type="button" onClick={onClick}>
    <span className={`${styles.itemIcon} ${danger ? styles.dangerIcon : ''}`}>
      <Icon className={styles.icon} />
    </span>
    <span className={styles.itemText}>
      <span className={styles.itemTitle}>{title}</span>
      <span className={styles.itemDescription}>{description}</span>
    </span>
    {trailing ?? <MdChevronRight className={styles.chevron} />}
  </button>
);

type Modal = 'none' | 'language' | 'delete' | 'credentials' | 'login' | 'password';

export const Settings = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { isDarkTheme, toggleTheme } = useTheme();
  const { t, locale, languageLabel, setLanguage } = useTranslation();
  const [activeModal, setActiveModal] = useState<Modal>('none');

  const handleThemeChange = () => {
    toggleTheme();
  };

  const handleLanguageSave = async (langCode: Locale) => {
    await setLanguage(langCode);
  };

  const handleDeleted = () => {
    setActiveModal('none');
    logout();
  };

  const close = () => setActiveModal('none');

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.page}>
          <header className={styles.header}>
            <h1>{t('settings.title')}</h1>
          </header>

          <section className={styles.card} aria-labelledby="account-settings-title">
            <h2 id="account-settings-title">{t('settings.account')}</h2>
            <div className={styles.list}>
              <SettingsItem
                icon={ProifileIcon}
                title={t('settings.editProfile')}
                description={t('settings.editProfileDesc')}
                onClick={() => navigate('/settings/edit-profile')}
              />
              <SettingsItem
                icon={LockIcon}
                title={t('settings.changeCredentials')}
                description={t('settings.changeCredentialsDesc')}
                onClick={() => setActiveModal('credentials')}
              />
              <SettingsItem
                icon={DeleteIcon}
                title={t('settings.deleteAccount')}
                description={t('settings.deleteAccountDesc')}
                danger
                onClick={() => setActiveModal('delete')}
              />
            </div>
          </section>

          <section className={styles.card} aria-labelledby="general-settings-title">
            <h2 id="general-settings-title">{t('settings.general')}</h2>
            <div className={styles.list}>
              <SettingsItem
                icon={ThemeIcon}
                title={t('settings.theme')}
                description={isDarkTheme ? t('settings.themeDark') : t('settings.themeStandard')}
                trailing={
                  <span
                    className={`${styles.switch} ${isDarkTheme ? styles.switchOn : ''}`}
                    aria-hidden="true"
                  >
                    <MdLightMode className={styles.switchSun} />
                    <MdDarkMode className={styles.switchMoon} />
                    <span className={styles.switchThumb} />
                  </span>
                }
                onClick={handleThemeChange}
              />
              <SettingsItem
                icon={LanguageIcon}
                title={t('settings.language')}
                description={languageLabel}
                onClick={() => setActiveModal('language')}
              />
              <SettingsItem
                icon={HelpIcon}
                title={t('settings.help')}
                description={t('settings.helpDesc')}
                onClick={() => navigate('/help')}
              />
            </div>
          </section>

          <div className={styles.footer}>
            <button className={styles.logoutButton} type="button" onClick={logout}>
              <MdLogout className={styles.logoutIcon} />
              {t('settings.logout')}
            </button>
          </div>
        </div>
      </main>

      <LanguageModal
        isOpen={activeModal === 'language'}
        currentLanguage={locale}
        onClose={close}
        onSave={handleLanguageSave}
      />

      <DeleteAccountModal
        isOpen={activeModal === 'delete'}
        userEmail={user?.email ?? ''}
        onClose={close}
        onDeleted={handleDeleted}
      />

      <ChangeCredentialsModal
        isOpen={activeModal === 'credentials'}
        onClose={close}
        onChangeLogin={() => setActiveModal('login')}
        onChangePassword={() => setActiveModal('password')}
      />

      <ChangeLoginModal
        isOpen={activeModal === 'login'}
        onClose={close}
      />

      <ChangePasswordModal
        isOpen={activeModal === 'password'}
        userEmail={user?.email ?? ''}
        onClose={close}
      />
    </div>
  );
};
