export interface LocaleDefinition {
  code: string;
  langPrefixes: string[];
  translations: () => Promise<Record<string, string>>;
  angularLocale?: string;
}

export const LOCALES: LocaleDefinition[] = [
  {
    code: 'ru-RU',
    langPrefixes: ['ru'],
  {
    code: 'ru-RU',
    langPrefixes: ['ru'],
    translations: () => import('./locale/ru-dominion').then(m => m.TRANSLATIONS_RU_DOMINION),
  angularLocale: 'ru',
  },
];

export const DEFAULT_LOCALE = 'en-CA';
