# Post Editors

Posts are written using `PostFormComponent` (`src/app/components/post-form/`), which hosts two interchangeable editor modes. The user switches between them with the toolbar button; the active mode is persisted per user via `editor_type` in the user object (`0` = WYSIWYG, `1` = BB code).

Both modes share the same BB toolbar (`BbToolbarComponent`) and produce **BB code** as the canonical output format. `getValue()` always returns BB code regardless of which mode is active.

---

## WYSIWYG mode (`WysiwygEditorComponent`)

A `contenteditable` div. The user edits formatted content visually. On `getValue()`, the current HTML is converted to BB code via `htmlToBbCode()` in `wysiwyg-editor.utils.ts`. On `setValue()`, existing BB code is converted back to HTML via `bbCodeToHtml()`.

**Key behaviours:**
- Inline formatting (bold, italic, etc.) uses `document.execCommand`.
- Block formatting (alignment) wraps content in `<div style="text-align:…">`.
- Smiles are inserted as `<img src="…" class="smile">`.
- Uploaded/pasted images are inserted as `<img src="…" style="max-width:100%">` (constrained to editor width).
- Videos/audio are inserted as raw BB tags (`[video][/video]`) because there is no HTML equivalent in the editor.
- Spoilers are represented as a `<div class="wysiwyg-spoiler">` with two children: `.wysiwyg-spoiler-header` (title) and `.wysiwyg-spoiler-content` (body).
- `Enter` inside `.wysiwyg-spoiler-content` inserts a line break instead of a new paragraph.

## BB code mode

A plain `<textarea>`. The user types BB tags directly. No conversion is needed; `getValue()` returns the textarea value as-is.

---

## Mention autocomplete

Triggered in both modes by typing `@` followed by one or more non-space characters. A dropdown appears; selecting a user inserts the mention.

**Canonical mention format:**

```
@username<U+200A>
```

- Starts with a literal `@` sign (kept in the text, not removed).
- Followed immediately by the username with no space between `@` and the name.
- Terminated by **U+200A (HAIR SPACE)**, codepoint `0x200A`. This is a distinct Unicode character — not a regular space (U+0020) and not any other whitespace.

The hair space acts as the mention terminator so the backend can reliably detect where the username ends without ambiguity.

**Detection regex** (what triggers the dropdown):

```
/@([^ @]*)$/
```

Applied to the text before the cursor. Matches an `@` followed by any non-space, non-`@` characters up to end of current input.

**Implementation** (`selectMention` in `post-form.component.ts`):
- BB code mode: replaces the characters typed after `@` (not `@` itself) with `username + U+200A`.
- WYSIWYG mode: calls `replaceBeforeCursor(charsToDelete, inserted)` where `charsToDelete` is the number of characters typed after `@`, leaving `@` in place.

---

## BB tags reference

All tags are case-insensitive on the backend. The frontend always writes them in lowercase.

### Inline formatting

| Tag | Syntax | Notes |
|---|---|---|
| Bold | `[b]text[/b]` | |
| Italic | `[i]text[/i]` | |
| Underline | `[u]text[/u]` | |
| Strikethrough | `[s]text[/s]` | |
| Color | `[color=value]text[/color]` | `value` is any CSS color: named (`red`), hex (`#ff0000`), rgb(`rgb(255,0,0)`) |
| Font family | `[font="Name"]text[/font]` | Quotes around the name are optional but preferred. Available fonts in toolbar: Arial, Verdana, Georgia, Times New Roman, Courier New, Impact |
| Font size | `[size=N]text[/size]` | `N` is pixels. Available sizes in toolbar: 8, 10, 12, 14, 16, 18, 20 |

### Links and media

| Tag | Syntax | Notes |
|---|---|---|
| URL | `[url=href]label[/url]` | `href` must be a full URL |
| Image | `[img]url[/img]` | Smiles are also stored as `[img]` |
| Video | `[video]url[/video]` | Embed; no WYSIWYG preview — inserted as raw tag in both modes |
| Audio | `[audio]url[/audio]` | Embed; same as video |

### Block formatting

| Tag | Syntax | Notes |
|---|---|---|
| Center | `[center]text[/center]` | |
| Right-align | `[right]text[/right]` | |
| Left-align | `[left]text[/left]` | Explicit left; rarely needed |
| Quote | `[quote]text[/quote]` | Anonymous blockquote |
| Quote (attributed) | `[quote=Author]text[/quote]` | Author name shown above quote |
| Code | `[code]text[/code]` | Renders as `<pre>`; content is not further parsed |
| Spoiler | `[spoiler]text[/spoiler]` | Collapsible block with default "Spoiler" header |
| Spoiler (titled) | `[spoiler=Title]text[/spoiler]` | Collapsible block with custom header |

### Grid layout

Built by `GridBuilderComponent`. The grid is a multi-column layout.

```
[grid columns="N"]
[grid-item col="C" col-span="S"]
content
[/grid-item]
…
[/grid]
```

- `columns` — total number of columns in the grid.
- `col` — 1-based starting column of the item.
- `col-span` — how many columns the item spans.

---

## HTML ↔ BB code conversion

`wysiwyg-editor.utils.ts` handles both directions. Only the tags listed above are roundtripped; any other HTML is passed through as inner text. Key mapping:

| BB tag | HTML representation in editor |
|---|---|
| `[b]` | `<b>` or `<strong>` |
| `[i]` | `<i>` or `<em>` |
| `[u]` | `<u>` |
| `[s]` | `<s>`, `<del>`, or `<strike>` |
| `[color=…]` | `<font color="…">` or `<span style="color:…">` |
| `[font="…"]` | `<font face="…">` or `<span style="font-family:…">` |
| `[size=N]` | `<span style="font-size:Npx">` |
| `[url=…]` | `<a href="…">` |
| `[img]…[/img]` | `<img src="…">` |
| `[center/right/left]` | `<div style="text-align:…">` or `<p style="text-align:…">` |
| `[quote]` / `[quote=A]` | `<blockquote>` / `<blockquote data-author="A">` |
| `[code]` | `<pre>` |
| `[spoiler=T]` | `<div class="wysiwyg-spoiler" data-title="T">` |
| newline | `<br>` (in `bbCodeToHtml`) / `\n` (in `htmlToBbCode` at block boundaries) |

`[video]`, `[audio]`, and `[grid…]` tags have no HTML equivalent in the editor — they are inserted and read back as literal text strings in WYSIWYG mode.
