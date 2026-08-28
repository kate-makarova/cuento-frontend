# Custom Templates

The custom template system allows overriding the HTML template of specific Angular components **at build time**, without modifying the default templates that live in the repository. This is used to produce site-specific builds (e.g. cuento.ca) while keeping the generic defaults intact.

## How it works

`npm run build` runs `node custom-templates.plugin.mjs` instead of `ng build` directly.

The plugin:
1. Reads `src/environments/custom_templates.json` (not committed — site-specific, gitignored).
2. For each entry, copies the custom template file over the default `.html` file, saving a `.bak` of the original.
3. Runs `ng build` (any extra CLI args are forwarded).
4. Restores all original templates from their `.bak` files, regardless of whether the build succeeded.

`ng serve` (dev mode) is **not** affected — it always uses the default templates.

## Configuration file

`src/environments/custom_templates.json` — array of substitution rules:

```json
[
  {
    "default_template": "src/app/components/header/header.component.html",
    "template": "src/app/components/header/header.custom.component.html"
  },
  {
    "default_template": "src/app/components/category/category.component.html",
    "template": "src/app/components/category/category.custom.component.html"
  }
]
```

If the file does not exist, the build runs normally with no substitutions.

## Available custom templates

### Header — `src/app/components/header/header.custom.component.html`

Overrides `header.component.html`. The template belongs to `HeaderComponent` and has access to all its public properties:

| Binding | Type | Description |
|---|---|---|
| `title()` | `Signal<string>` | Site name from board settings |
| `currentUser()` | `Signal<User \| null>` | Logged-in user |
| `authService.isAuthenticated()` | `Signal<boolean>` | Auth state |
| `headerPanelHtml()` | `Signal<SafeHtml>` | Backend-rendered HTML panel (widgets, etc.) |
| `navlinksAfterHeader()` | `Signal<boolean>` | Whether navlinks appear below the header panel |

Available directives and child components that must be declared in `HeaderComponent.imports`:
- `app-navlinks` / `app-ulinks` — navigation and user links panels
- `app-notifications` — unread notification badges (authenticated users only)
- `appRouterLinks` — converts plain `<a href>` links inside `[innerHTML]` blocks to Angular router navigation

The `#header-widget-panel` element with `[innerHTML]="headerPanelHtml()"` and `appRouterLinks` is the standard container for the backend-rendered widget panel. Keep this element in the custom template so widgets and panel reloads work correctly.

### Category — `src/app/components/category/category.custom.component.html`

Overrides `category.component.html`. The template belongs to `CategoryComponent` and receives the category data via an `@Input`:

| Binding | Type | Description |
|---|---|---|
| `category` | `Category` | The category object with `.name` and `.subforums[]` |
| `category.subforums[].id` | `number` | Subforum ID (used for router links) |
| `category.subforums[].name` | `string` | Display name |
| `category.subforums[].description_html` | `string \| null` | Rich HTML description |
| `category.subforums[].topic_number` | `number` | Topic count |
| `category.subforums[].post_number` | `number` | Post count |
| `category.subforums[].has_new_messages` | `boolean` | Unread indicator |
| `category.subforums[].last_post_*` | various | Last post metadata |
| `category.subforums[].show_last_topic` | `boolean` | Whether to link last topic or last post |


### Footer statistics — `src/app/components/footer-statistics/footer-statistics.custom.component.html`

Overrides `footer-statistics.component.html`. The template belongs to `FooterStatisticsComponent` and has access to:

| Binding | Type | Description |
|---|---|---|
| `board()` | `Signal<Board>` | Full board settings object (stats counts, newest user, etc.) |
| `activeUsers()` | `Signal<UserShort[]>` | Users currently online |
| `activeGuests()` | `Signal<number>` | Guest count currently online |
| `recentUsers()` | `Signal<{id, username}[]>` | Users active in the last 24 h |
| `recentCharacters()` | `Signal<{id, name}[]>` | Characters active in the last 24 h |
| `recentMode()` | `Signal<'users' \| 'characters'>` | Which recent list is displayed |
| `setRecentMode(m)` | method | Switches `recentMode` |
| `authService.isAuthenticated()` | `Signal<boolean>` | Auth state |

Available imports declared in `FooterStatisticsComponent`: `RouterLink`.

### Episode header — `src/app/components/episode-header/episode-header.custom.component.html`

Overrides `episode-header.component.html`. The template belongs to `EpisodeHeaderComponent` and has access to:

| Binding | Type | Description |
|---|---|---|
| `episode` | `Episode \| null` | The episode object; template should guard with `@if (episode != null)` |
| `episode.name` | `string` | Episode title |
| `episode.episode_status` | `number` | `0` = active, `1` = inactive |
| `episode.open_to_everyone` | `boolean` | Whether the episode is open to any character |
| `episode.characters` | `{id, name}[]` | Participating characters |
| `episode.masks` | `{id, mask_name, user_name}[]` | Masks (anonymous participants) |
| `episode.rating_set` | `boolean` | Whether a content rating is assigned |
| `episode.rating_language` | `number` | Language rating value |
| `episode.rating_violence` | `number` | Violence rating value |
| `episode.rating_sex` | `number` | Sex rating value |
| `ratingBadge` | `string \| null` | Pre-formatted rating string e.g. `L1V2S0`; `null` if no rating set |
| `customFields` | `{fieldMachineName, fieldName, fieldValue, type}[]` | Processed custom fields, sorted by order |
| `getField(machineName)` | method | Returns a single custom field by machine name, or `undefined`. Use with `@if (getField('x'); as field)` to conditionally render a specific field. |

Available imports declared in `EpisodeHeaderComponent`: `RouterLink`, `FieldDisplayComponent` (`app-field-display`), `CommonModule`.

### Wanted character card — `src/app/components/wanted-character-card/wanted-character-card.custom.component.html`

Overrides `wanted-character-card.component.html`. The template belongs to `WantedCharacterCardComponent` and renders a single card in the wanted character list card view. Has access to:

| Binding | Type | Description |
|---|---|---|
| `wantedCharacter` | `WantedCharacter` | The wanted character data object |
| `wantedCharacter.name` | `string` | Character name |
| `wantedCharacter.topic_id` | `number` | Topic ID (used for `/viewtopic` links) |
| `wantedCharacter.factions` | `Faction[] \| null` | Faction memberships |
| `wantedCharacter.relations` | `CharacterShort[] \| undefined` | Related characters |
| `wantedCharacter.claim_record` | `ClaimRecord \| null` | Active claim record, if any |
| `wantedCharacter.user_info` | `UserInfo \| null \| undefined` | Player info block |
| `expanded` | `boolean` | Whether the card is in expanded state |
| `canRevoke` | `boolean` | Whether the current user can revoke the claim |
| `isAuthenticated` | `boolean` | Whether a user is logged in |
| `fields` | `WantedCharacterCardField[]` | Processed custom fields, sorted by order |
| `factionsString` | `string` | Comma-joined faction names |
| `getField(machineName)` | method | Returns a single custom field by machine name, or `undefined` |
| `(expand)` | output | Emit to expand the card |
| `(collapse)` | output | Emit to collapse the card |
| `(claim)` | output | Emit to claim the wanted character |
| `(revoke)` | output | Emit to revoke the active claim |

Available imports declared in `WantedCharacterCardComponent`: `RouterLink`, `CommonModule`, `DatePipe`, `FieldDisplayComponent` (`app-field-display`), `UserInfoComponent` (`app-user-info`).

### Character header — `src/app/components/character-sheet-header/character-sheet-header.custom.component.html`

Overrides `character-sheet-header.component.html`. The template belongs to `CharacterSheetHeaderComponent` and has access to:

| Binding | Type | Description |
|---|---|---|
| `character` | `Character \| null` | The character object; template should guard with `@if (character != null)` |
| `character.name` | `string` | Character name |
| `character.avatar` | `string \| null` | Avatar URL |
| `character.character_status` | `number` | `0` = active, `1` = inactive, `2` = pending, `3` = declined |
| `character.factions` | `Faction[] \| null` | Faction memberships |
| `character.topic_id` | `number` | ID of the character's topic |
| `character.total_episodes` | `number` | Total episode count |
| `customFields` | `{fieldMachineName, fieldName, fieldValue, type}[]` | Processed custom fields, sorted by order |
| `getField(machineName)` | method | Returns a single custom field by machine name, or `undefined` |
| `factionsHeader` | `string` | Label for the factions block (from faction setting name, or `'Factions'`) |
| `canSeeAdminBlock()` | `Signal<boolean>` | Whether the current user can see admin action buttons |
| `hasPendingFactions` | `boolean` | Whether any faction is still pending approval |
| `acceptCharacter()` | method | Admin: accept a pending character |
| `declineCharacter()` | method | Admin: decline a pending character |
| `activateCharacter()` | method | Admin: activate an inactive character |
| `deactivateCharacter()` | method | Admin: deactivate an active character |
| `moveToPending()` | method | Admin: move character back to pending |

Available imports declared in `CharacterSheetHeaderComponent`: `CommonModule`, `FieldDisplayComponent` (`app-field-display`).

### Wanted character header — `src/app/components/wanted-character-header/wanted-character-header.custom.component.html`

Overrides `wanted-character-header.component.html`. The template belongs to `WantedCharacterHeaderComponent` and has access to:

| Binding | Type | Description |
|---|---|---|
| `wantedCharacter` | `WantedCharacter \| null` | The wanted character object; template should guard with `@if (wantedCharacter != null)` |
| `wantedCharacter.name` | `string` | Character name |
| `wantedCharacter.wanted_character_status` | `number \| undefined` | `0` = active, `1` = inactive |
| `wantedCharacter.is_claimed` | `boolean` | Whether permanently claimed |
| `wantedCharacter.active_claim_record` | `string \| null` | Expiration date string if temporarily claimed |
| `wantedCharacter.factions` | `Faction[] \| null` | Faction memberships |
| `wantedCharacter.relations` | `CharacterShort[] \| undefined` | Related characters |
| `wantedCharacter.topic_id` | `number` | ID of the wanted character's topic |
| `customFields` | `{fieldMachineName, fieldName, fieldValue, type}[]` | Processed custom fields, sorted by order |
| `getField(machineName)` | method | Returns a single custom field by machine name, or `undefined` |
| `factionsHeader` | `string` | Label for the factions block (from faction setting name, or `'Factions'`) |

Available imports declared in `WantedCharacterHeaderComponent`: `CommonModule`, `DatePipe`, `RouterLink`, `FieldDisplayComponent` (`app-field-display`).

## Adding a new custom template

1. Create a `*.custom.component.html` file alongside the default template, following the naming convention `<name>.custom.component.html` (e.g. `header.custom.component.html`, not `header.component.custom.html`).
2. Write a valid Angular template — it will be compiled as the template of the existing component class, so it must only use bindings and directives that component declares or imports.
3. Add an entry to `src/environments/custom_templates.json`.
4. The next `npm run build` will use the custom template.

The default template is never modified in the repository. `*.custom.component.html` files **are** committed and tracked.
