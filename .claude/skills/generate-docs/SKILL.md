---
name: generate-docs
description: This skill should be used when the user asks to "generate user manual", "generate docs", "write documentation", "create a user guide", "document a feature", or wants to turn a docs folder's outline and screenshots into a polished markdown user manual. Use it for any folder under docs/ that has an outline.txt and screenshots.
version: 1.0.0
---

# Generate User Manual from Outline and Screenshots

Convert a `docs/<folder>/` directory into a polished markdown user manual by reading its `outline.txt` (the feature description and step list) and its screenshots (taken in step order), then writing a richly formatted `docs/<folder>/<folder>.md`.

## Inputs

`$ARGUMENTS` — the subfolder name under `docs/` to process (e.g. `user-migration`).

If `$ARGUMENTS` is empty, process **every** subfolder in `docs/` that contains an `outline.txt`.

## Process

### Step 0 — crop screenshots to their content area

Before reading or embedding any screenshot, run the bundled crop script on all PNGs in the target folder(s). This removes the page chrome (header, nav, background) and keeps only the active content box.

```bash
python3 .claude/skills/generate-docs/scripts/crop_to_content.py docs/<folder>/*.png
```

The script overwrites each file in-place. It detects the background color from the image corners and trims all edges that match it, leaving a small padding around the content. If a file has no significant background (already cropped, or a solid-colored image), it is skipped unchanged.

Run this **before** reading the images in Step 2 so that the images you read and embed are already cropped.

### Step 1 — discover the target folder(s)

```bash
# If a folder was given:
ls docs/<folder>/

# If no argument, find all candidates:
find docs -maxdepth 2 -name "outline.txt" | sed 's|/outline.txt||'
```

For each target folder collect:
- `outline.txt` — the structural backbone  
- PNG files in **alphabetical order** — the screenshots, already numbered sequentially

### Step 2 — read the inputs

Read `outline.txt` to extract:
- **Feature name** — used as the `# H1` title
- **Function/description** — used as the intro paragraph
- **Process steps** — the ordered list of things the user does; each step becomes a numbered section

Read every screenshot with the `Read` tool (Claude Code can display images) to understand what each screen shows before writing about it. This ensures the prose accurately describes the UI, not just the outline's words.

### Step 3 — write the manual

Output file: `docs/<folder>/<folder>.md`

**Template to follow:**

```markdown
# <Feature Name>

<One-paragraph intro: what this feature does and who it is for.
Expand naturally on the outline's Function description.>

## How to use <Feature Name>

### Step 1 — <Step title derived from first outline bullet>

<2–4 sentences explaining what the user does and why, written for a non-technical end user.
Mention what they will see or what will happen next.>

![<Brief alt text describing the UI state>](./<screenshot-filename>.png)

---

### Step 2 — ...
```

**Rules for good output:**

- Derive section titles from the outline bullets — keep them short and verb-led (e.g. "Fill in the migration form", "Paste the extracted data").
- One screenshot per step. If a step has no screenshot, write it in prose only. If there are more screenshots than steps, append extras after the closest relevant section with a short caption explaining what they show.
- Use relative image paths (`./01-create-form.png`) — the manual lives in the same directory as the screenshots.
- Tone: clear and friendly, written for the person using the forum, not a developer. No jargon unless the outline itself uses it.
- Expand on the outline — the outline is a bullet list; the manual is a guide. Add context, explain consequences ("If any character is missing the migration cannot complete — add them to the episode first"), and surface tips from the outline's wording.
- Add a brief `## Tips` or `## Notes` section at the end if the outline contains any caveats or non-obvious details worth highlighting.

### Step 4 — output

Write the finished file to `docs/<folder>/<folder>.md`.

Report which file was written and how many steps and screenshots were included.
