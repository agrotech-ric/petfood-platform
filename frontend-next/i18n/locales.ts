import type { Locale } from './types';

export type LanguageOption = {
  code: Locale;
  labelKey: 'language.ru' | 'language.en' | 'language.kz';
  sublabelKey: 'language.ruSub' | 'language.enSub' | 'language.kzSub';
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'ru', labelKey: 'language.ru', sublabelKey: 'language.ruSub' },
  { code: 'en', labelKey: 'language.en', sublabelKey: 'language.enSub' },
  { code: 'kz', labelKey: 'language.kz', sublabelKey: 'language.kzSub' },
];

export const DEFAULT_LOCALE: Locale = 'ru';
export const STORAGE_KEY = 'settings.language';

export function normalizeLocale(value?: string | null): Locale {
  if (value === 'en' || value === 'kz' || value === 'ru') return value;
  return DEFAULT_LOCALE;
}
