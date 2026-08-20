import type { Locale } from './types';
import { ru } from './ru';
import { en } from './en';
import { kz } from './kz';

export type { Locale, TranslationKey } from './types';
export { LANGUAGE_OPTIONS, DEFAULT_LOCALE, STORAGE_KEY, normalizeLocale } from './locales';

export const translations: Record<Locale, Record<keyof typeof ru, string>> = {
  ru,
  en,
  kz,
};

export function translate(
  locale: Locale,
  key: keyof typeof ru,
  params?: Record<string, string | number>,
): string {
  const template = translations[locale][key] ?? translations.ru[key] ?? key;
  if (!params) return template;
  return Object.entries(params).reduce(
    (result, [name, value]) => result.replace(`{{${name}}}`, String(value)),
    template,
  );
}
