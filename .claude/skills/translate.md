# Translation Skill

Translate new i18n keys into Russian and add them to the backend locale file.

## Locale file locations

- **Frontend English source**: `src/locale/en.ts` — exports `TRANSLATIONS_EN`
- **Backend Russian target**: `../cuento-backend/locales/ru.ts` — exports `TRANSLATIONS_RU`

Both repos sit under the same parent: `cuento-frontend/` and `cuento-backend/` are siblings.

## When to use

Use this skill after adding new feature keys. It finds keys that are present in `en.ts` but missing from `ru.ts` and adds Russian translations for them.

## Workflow

1. Read `src/locale/en.ts` and collect all keys.
2. Read `../cuento-backend/locales/ru.ts` and collect all keys.
3. Identify keys present in English but missing in Russian.
4. Translate the missing values into natural Russian (see notes below).
5. Append the new key-value pairs to `../cuento-backend/locales/ru.ts` before the closing `};`. The file is not strictly alphabetical — append near related keys (same prefix) or at the end.
6. Report which keys were added.

## Translation notes

- Tone: informal, natural Russian suitable for a fantasy roleplay forum community.
- Admin UI strings (keys starting with `admin`) can be more neutral/formal.
- Preserve any interpolation placeholders like `{{ variable }}` exactly as-is.
- Do not add keys that already exist in the Russian file, even if the translation looks different.

## Also check en.ts

If the task includes adding keys for a new feature, make sure they are in `src/locale/en.ts` first. The skill translates existing EN keys — it does not add missing EN keys on its own.
