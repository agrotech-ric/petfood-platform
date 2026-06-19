import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { profileService } from '../services/profileService';
import {
  DEFAULT_LOCALE,
  LANGUAGE_OPTIONS,
  STORAGE_KEY,
  normalizeLocale,
  translate,
  type Locale,
} from '../i18n';
import type { ru } from '../i18n/ru';

type TranslationKey = keyof typeof ru;

type LanguageContextType = {
  locale: Locale;
  languageLabel: string;
  setLanguage: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function readStoredLocale(): Locale {
  try {
    return normalizeLocale(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function applyLocale(locale: Locale) {
  document.documentElement.lang = locale === 'kz' ? 'kk' : locale;
}

export function initLocale() {
  applyLocale(readStoredLocale());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());
  const [profileSynced, setProfileSynced] = useState(false);

  useEffect(() => {
    applyLocale(locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore storage errors
    }
  }, [locale]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setProfileSynced(false);
      return;
    }

    let cancelled = false;

    const syncFromProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        if (cancelled) return;
        if (profile.language) {
          setLocaleState(normalizeLocale(profile.language));
        }
      } catch {
        // keep localStorage locale
      } finally {
        if (!cancelled) setProfileSynced(true);
      }
    };

    if (!profileSynced) {
      void syncFromProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, profileSynced]);

  const setLanguage = useCallback(
    async (next: Locale) => {
      setLocaleState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }

      if (isAuthenticated) {
        await profileService.updateProfile({ language: next });
      }
    },
    [isAuthenticated],
  );

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  );

  const languageLabel = useMemo(() => {
    const option = LANGUAGE_OPTIONS.find((item) => item.code === locale);
    return option ? t(option.labelKey) : t('language.ru');
  }, [locale, t]);

  const value = useMemo(
    () => ({
      locale,
      languageLabel,
      setLanguage,
      t,
    }),
    [locale, languageLabel, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, locale, languageLabel, setLanguage } = useLanguage();
  return { t, locale, languageLabel, setLanguage };
}
