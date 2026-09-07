# Android GBoard IME Behaviour in the Doc Editor

This document covers the Android GBoard input bugs found and fixed in `wysiwyg-doc-editor.component.ts`, the event sequences that reveal them, and the reasoning behind each fix. It is intended for future debugging of similar IME issues.

---

## Background: How the doc editor intercepts input

The doc editor (`src/app/components/wysiwyg-editor/wysiwyg-doc-editor.component.ts`) uses an immutable `DocModel` and intercepts all browser input through `beforeinput` + `event.preventDefault()`. The DOM is never trusted as the source of truth — the model drives the DOM via `render()` (full replacement) or `patchDoc()` (minimal text-node patching).

This architecture conflicts with how Android IMEs work, because GBoard and other Android keyboards:
- Write directly into the DOM via the browser's InputMethod Connection
- Track specific DOM text-node references internally
- Fire composition events asynchronously relative to DOM changes
- Occasionally bypass `preventDefault()` on certain event types

---

## Android composition event model

On Android, typing via GBoard goes through a **composition session**:

1. `compositionstart` — GBoard opens an InputMethod session and begins tracking a text node
2. `insertCompositionText` (`beforeinput`, repeated) — each keystroke replaces the current composition with the updated string; the whole in-progress word is selected [0, N] in `compositionupdate`
3. `compositionend` — the word is committed (e.g., user presses space or taps a suggestion)

During composition, **all character changes go through `insertCompositionText`**, not `insertText`. GBoard replaces the entire in-progress word on every keystroke. The browser's DOM selection during composition is non-collapsed (0 to length of current composition), but `selectionchange` fires asynchronously and is often stale.

After `compositionend`, GBoard may immediately fire a non-composition `deleteContentBackward` + `insertText` sequence to perform autocorrect (see below).

**Key asymmetry**: `beforeinput` events fire synchronously with `isComposing` flag, but `selectionchange` is async — meaning `this.cursor` may lag behind the actual browser selection at the moment a `beforeinput` fires.

---

## Bug 1: Word multiplication on GBoard autocorrect

### Symptom
After typing a word via GBoard (e.g., "Автокоррекция"), the editor displayed the word doubled: "АвтокоррекциАвтокоррекция".

### What actually happens (from event logs)

The GBoard autocorrect flow is **not** `insertReplacementText`. It is:

```
compositionend("Автокоррекция")       — word committed by our compositionend handler
deleteContentBackward                  — isComposing=false, targetRanges=[{0, 13}]
insertText("Автокоррекция")           — the autocorrected word, isComposing=false
```

GBoard selects the entire just-committed word (offset 0–13) and fires `deleteContentBackward` to erase it, then `insertText` to re-insert the (possibly corrected) word.

### Why it broke

Our `compositionend` handler sets `this.cursor = {offset: 13}` (collapsed, at end of word) and calls `render()`. The browser then moves its selection to [0, 13] for the autocorrect delete, but **`selectionchange` fires asynchronously and has not updated `this.cursor`** by the time `deleteContentBackward` fires (~17ms later). So `this.cursor` is still `{offset: 13}` (collapsed).

Our `deleteContentBackward` handler saw a collapsed range and deleted only one character (`'я'`, offset 12–13), leaving "Автокоррекци". Then `insertText("Автокоррекция")` arrived with our cursor at offset 12, and we inserted there — producing "АвтокоррекциАвтокоррекция".

### Fix

Use `event.getTargetRanges()` in `deleteContentBackward`. The browser computes `targetRanges` synchronously at event creation time — it correctly shows `[{0, 13}]` (the full word) even though `selectionchange` hasn't fired yet.

```typescript
case 'deleteContentBackward': {
  const targetRanges = (event as InputEvent & { getTargetRanges?(): StaticRange[] }).getTargetRanges?.();
  let handled = false;
  if (targetRanges?.length) {
    const tr = targetRanges[0];
    const anchor = domPositionToDocPoint(tr.startContainer, tr.startOffset, this.editorEl.nativeElement);
    const focus  = domPositionToDocPoint(tr.endContainer,   tr.endOffset,   this.editorEl.nativeElement);
    if (anchor && focus) {
      this.commitOp(modelDeleteRange(this.doc, { anchor, focus }), 'delete', true);
      handled = true;
    }
  }
  if (!handled) {
    // cursor-based fallback (unchanged)
  }
}
```

This is the same pattern already used for `deleteWordBackward`, `deleteWordForward`, etc. After this fix, the correct deletion range is used and `insertText` arrives with our cursor correctly at offset 0 (the model is empty), so "Автокоррекция" is inserted cleanly.

**`targetRanges` is safe to use for all `deleteContentBackward` events**, not just autocorrect. For a regular backspace, `targetRanges` returns `[{cursor-1, cursor}]`, which produces the same result as the cursor-based fallback.

---

## Bug 2: Keyboard dismissal on repeated backspacing

### Symptom
After typing a word and pressing backspace several times in a row, the Android virtual keyboard would spontaneously dismiss mid-sequence. The editor text was correct, but the user had to tap the input again to bring the keyboard back — a ~1-second interruption.

### What actually happens (from event logs)

Every `deleteContentBackward` event was going through `commitOp(..., fullRender=true)`, which called `resetAndroidIME()`:

```typescript
private resetAndroidIME(): void {
  const el = this.editorEl.nativeElement;
  el.blur();
  requestAnimationFrame(() => {
    el.focus();
    applyDocRange(savedCursor, el);
  });
}
```

This `blur()` + rAF `focus()` is designed to force GBoard to tear down its InputMethod connection and re-establish it on the fresh DOM. But it fired on **every single backspace**, including regular backspaces outside of any composition.

The event log shows viewport resize events (`visualViewport.resize`) after each blur/focus cycle — the Android keyboard was adjusting on every backspace press. After 5 rapid backspaces, the accumulated adjustments caused the keyboard to dismiss entirely:

```
beforeinput(deleteContentBackward)  t=88062   ← backspace #5
blur                                t=88072   ← from resetAndroidIME()
focus                               t=88085   ← rAF in resetAndroidIME()
visualViewport.resize               t=88213   ← keyboard adjusting
visualViewport.resize               t=88385   ← keyboard still adjusting
blur                                t=88402   ← keyboard dismissed itself
focus                               t=89458   ← keyboard back (1+ second later)
```

### Fix

Remove `resetAndroidIME()` from `commitOp`. It was originally added as a safety net to prevent GBoard from replaying a stale composition buffer after `render()`. But:

1. **`render()` already destroys GBoard's tracked text nodes**, forcing GBoard to re-read the DOM on next input. The safety net was redundant.
2. **The `targetRanges` fix** (Bug 1) means the model is always in the correct state after an autocorrect delete, so there is no stale buffer to replay.
3. **Regular backspaces outside composition** have no composition buffer at all — there is nothing to reset.

`resetAndroidIME()` is kept in one place: the `insertReplacementText` handler, where it genuinely ends a composition session and starts fresh.

---

## Event patterns cheat sheet

When debugging Android IME issues, instrument `beforeinput`, `compositionstart`, `compositionend`, `selectionchange`, `input`, `focus`, and `blur`. Key patterns:

| Pattern | Meaning |
|---|---|
| `compositionstart` → repeated `insertCompositionText` → `compositionend` | Normal word composition |
| `compositionend` (isComposing=false) → `deleteContentBackward` (targetRanges=[0,N]) → `insertText` | GBoard autocorrect replacing composed word |
| `compositionend` (isComposing=false) → `insertReplacementText` | Alternative GBoard autocorrect path (less common on Android 10/Chrome 138) |
| `deleteContentBackward` inside composition (isComposing=true) → repeated `insertCompositionText` | User pressing GBoard backspace during composition (in-composition delete) |
| `blur` firing synchronously inside a `beforeinput` handler | Our `resetAndroidIME()` call |
| `selectionchange` 15–30ms after a `compositionend` | GBoard setting selection after composition (often too late for the next beforeinput) |

---

## Architectural lessons

### 1. Never trust `this.cursor` in `beforeinput` for non-composition events after `compositionend`

`selectionchange` is async. GBoard can move the selection and fire a new `beforeinput` before `selectionchange` has updated `this.cursor`. Always prefer `event.getTargetRanges()` for delete events — it is computed synchronously.

### 2. `getTargetRanges()` is reliable for all delete inputTypes

The browser computes `targetRanges` at event dispatch time, reflecting the browser's actual intended range regardless of `this.cursor` state. Use it as the primary range source for all `deleteContent*`, `deleteWord*`, `deleteSoftLine*`, and `deleteHardLine*` events.

### 3. `render()` is the right tool after composition; `patchDoc()` is not

`patchDoc()` mutates existing text nodes in place. GBoard tracks those nodes and may re-apply its internal buffer content to them. `render()` replaces all DOM nodes, severing GBoard's references. Always use `render()` in the `compositionend` handler.

### 4. `blur()`+`focus()` to reset IME is aggressive — use sparingly

`resetAndroidIME()` works but causes the Android keyboard to reconnect its InputMethod session, which triggers a full keyboard resize/redraw cycle. Calling it on every delete event causes visual jitter and can cause the keyboard to dismiss after repeated rapid presses. Reserve it for situations where a stale GBoard buffer is actually observed (e.g., after an `insertReplacementText` that ends a composition).

### 5. Chrome Android may ignore `preventDefault()` on `deleteContentBackward`

In some Chrome Android versions, the browser applies the native delete even after `event.preventDefault()` in `beforeinput`. This is why the DOM may change despite our handler — but since we call `render()` synchronously in our handler, the DOM is immediately overwritten with the correct model state.

---

## Relevant code locations

| Location | Purpose |
|---|---|
| `wysiwyg-doc-editor.component.ts` — `onCompositionStart` | Snapshots `preCompositionState` for later reconciliation |
| `wysiwyg-doc-editor.component.ts` — `onCompositionEnd` | Reads `paraEl.textContent`, diffs against snapshot, commits to model via `render()` |
| `wysiwyg-doc-editor.component.ts` — `onBeforeInput`, `insertReplacementText` case | Handles non-composition autocorrect path; uses `preCompositionState` + `diffText` to find the composition range |
| `wysiwyg-doc-editor.component.ts` — `onBeforeInput`, `deleteContentBackward` case | Uses `getTargetRanges()` first, falls back to cursor-based logic |
| `wysiwyg-doc-editor.component.ts` — `commitOp` | Central commit; `fullRender=true` calls `render()` + `applyDocRange()` but NOT `resetAndroidIME()` |
| `wysiwyg-doc-editor.component.ts` — `resetAndroidIME` | Blur + rAF focus; kept only for `insertReplacementText` path |
| `wysiwyg-doc-cursor.ts` — `domPositionToDocPoint` | Maps a DOM node + offset to a `DocPoint` in the model; used to convert `targetRanges` |
