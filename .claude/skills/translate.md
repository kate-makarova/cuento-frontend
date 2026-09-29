# Translation Skill

Translate new i18n keys into Russian and add them to the backend locale file.

## Locale file locations

- **Frontend English source**: `src/locale/en.ts` (in this repo, `cuento-frontend`)
- **Backend Russian target**: `../cuento-backend/locales/ru.ts` (sibling repo)

Both files export a plain object (`TRANSLATIONS_EN` / `TRANSLATIONS_RU`) with string keys and string values.

## When to use

Use this skill after adding new keys to `src/locale/en.ts`. It finds keys that are present in the frontend English file but missing from the backend Russian file and adds translations for them.

## Workflow

1. Read `src/locale/en.ts` and collect all keys.
2. Read `../cuento-backend/locales/ru.ts` and collect all keys.
3. Identify keys present in English but missing in Russian.
4. Translate the missing values into natural Russian (informal, forum-appropriate tone — the project is a roleplay forum).
5. Insert the new key-value pairs into `../cuento-backend/locales/ru.ts`, keeping the object sorted alphabetically by key (matching the existing order).
6. Report which keys were added.

## Translation notes

- Tone: informal, natural Russian suitable for a fantasy roleplay forum community.
- Admin UI strings (keys starting with `admin`) can be more neutral/formal.
- Preserve any interpolation placeholders like `{{ variable }}` exactly as-is.
- Do not add keys that already exist in the Russian file, even if the translation looks different.
