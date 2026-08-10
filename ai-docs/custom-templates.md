# Custom Templates

The custom template system allows overriding the HTML template of specific Angular components **at build time**, without modifying the default templates that live in the repository. This is used to produce site-specific builds (e.g. cuento.ca) while keeping the generic defaults intact.

## How it works

`npm run build` runs `node custom-templates.plugin.mjs` instead of `ng build` directly.

The plugin:
1. Reads `src/environments/custom_templates.json` — committed to the repository. When adding a new custom template, update this file as part of the same commit.
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

## Adding a new custom template

1. Create a `*.custom.component.html` file alongside the default template.
2. Write a valid Angular template — it will be compiled as the template of the existing component class, so it must only use bindings and directives that component declares or imports.
3. Add an entry to `src/environments/custom_templates.json`.
4. The next `npm run build` will use the custom template.

The default template is never modified in the repository. `*.custom.component.html` files **are** committed and tracked.
