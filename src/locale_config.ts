export interface LocaleDefinition {
  code: string;
  langPrefixes: string[];
  translations: () => Promise<Record<string, string>>;
  angularLocale?: string;
}

export const LOCALES: LocaleDefinition[] = [
];

export const DEFAULT_LOCALE = 'en-CA';
