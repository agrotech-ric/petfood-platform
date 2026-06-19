export type Locale = 'ru' | 'en' | 'kz';

export type TranslationKey = keyof typeof import('./ru').ru;

export type Translations = Record<TranslationKey, string>;
