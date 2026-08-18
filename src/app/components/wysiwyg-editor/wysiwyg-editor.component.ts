import { Component, computed, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { BoardService } from '../../services/board.service';
import { ImageService } from '../../services/image.service';
import { htmlToBbCode, bbCodeToHtml } from './wysiwyg-editor.utils';

const FORMAT_COMMANDS: Record<string, string> = {
  b: 'bold', i: 'italic', u: 'underline', s: 'strikeThrough',
  left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight',
};

@Component({
  selector: 'app-wysiwyg-editor',
  standalone: true,
  styles: [`:host .wysiwyg-editor img { max-width: 100%; height: auto; }`],
  template: `
    <div
      #editorEl
      class="wysiwyg-editor"
      contenteditable="true"
      (focus)="onFocus()"
      (blur)="onBlur()"
      (input)="onInput()"
      (paste)="onPaste($event)"
      (dragover)="onDragOver($event)"
      (drop)="onDrop($event)"
      (keydown)="onKeyDown($event)"
    ></div>
  `,
})
export class WysiwygEditorComponent implements OnDestroy {
  @ViewChild('editorEl', { static: true }) private editorEl!: ElementRef<HTMLDivElement>;

  private imageService = inject(ImageService);
  private boardService = inject(BoardService);

  readonly canUpload = computed(() => this.boardService.board().use_image_uploading === 'y');
  readonly activeFormats = signal<Set<string>>(new Set());
  readonly activeColor = signal<string | null>(null);
  readonly activeFontSize = signal<number | null>(null);
  readonly activeFontFamily = signal<string | null>(null);

  setActiveColor(color: string | null) { this.activeColor.set(color); }
  setActiveFontSize(size: number | null) { this.activeFontSize.set(size); }
  setActiveFontFamily(family: string | null) { this.activeFontFamily.set(family); }

  private focused = false;
  private selectionHandler = () => this.updateActiveFormats();

  constructor() {
    document.addEventListener('selectionchange', this.selectionHandler);
  }

  ngOnDestroy() {
    document.removeEventListener('selectionchange', this.selectionHandler);
  }

  onFocus() { this.focused = true; this.updateActiveFormats(); }
  onBlur()  { this.focused = false; this.saveSelection(); }

  private readonly BLOCK_SEL = '.wysiwyg-code, .wysiwyg-spoiler, blockquote';

  onKeyDown(event: KeyboardEvent) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const anchor = range.commonAncestorContainer;
    const node = anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor as HTMLElement;

    if (event.key === 'Enter') {
      if (node?.closest('.wysiwyg-spoiler-content, .wysiwyg-code, blockquote')) {
        event.preventDefault();
        document.execCommand('insertLineBreak');
      }
      return;
    }

    if ((event.key === 'Backspace' || event.key === 'Delete') && this.wouldModifyBlock(range, event.key)) {
      event.preventDefault();
    }
  }

  private closestBlock(n: Node): Element | null {
    const el = n.nodeType === Node.TEXT_NODE ? n.parentElement : n as Element;
    return el?.closest(this.BLOCK_SEL) ?? null;
  }

  // For spoilers the editable root is the sub-element (header or content) containing
  // the cursor, so Backspace/Delete can't merge those two divs into each other.
  private editableRoot(block: Element, cursor: Node): Element {
    if (block.classList.contains('wysiwyg-code')) return block.querySelector('pre') ?? block;
    if (block.classList.contains('wysiwyg-spoiler')) {
      const el = cursor.nodeType === Node.TEXT_NODE ? (cursor as Text).parentElement : cursor as Element;
      return el?.closest('.wysiwyg-spoiler-header, .wysiwyg-spoiler-content') ?? block;
    }
    return block;
  }

  private wouldModifyBlock(range: Range, key: string): boolean {
    const editor = this.editorEl.nativeElement;
    const startBlock = this.closestBlock(range.startContainer);
    const endBlock   = this.closestBlock(range.endContainer);

    // Non-collapsed selection spanning a block boundary
    if (!range.collapsed && startBlock !== endBlock) return true;

    if (startBlock) {
      if (!range.collapsed) return false; // within-block selection — allow
      const root = this.editableRoot(startBlock, range.startContainer);
      const br = document.createRange();
      br.selectNodeContents(root);
      return key === 'Backspace'
        ? range.compareBoundaryPoints(Range.START_TO_START, br) <= 0
        : range.compareBoundaryPoints(Range.START_TO_END,   br) >= 0;
    }

    // Cursor is directly in the editor element (between block-level children)
    if (range.startContainer === editor) {
      if (key === 'Backspace' && range.startOffset > 0) {
        return (editor.childNodes[range.startOffset - 1] as Element).matches?.(this.BLOCK_SEL) ?? false;
      }
      if (key === 'Delete' && range.startOffset < editor.childNodes.length) {
        return (editor.childNodes[range.startOffset] as Element).matches?.(this.BLOCK_SEL) ?? false;
      }
      return false;
    }

    // Cursor inside a regular element (e.g. <div>) adjacent to a block
    let editorChild: Node | null = range.startContainer;
    while (editorChild?.parentNode !== editor) editorChild = editorChild?.parentNode ?? null;
    if (!editorChild) return false;

    const r = document.createRange();
    r.selectNodeContents(editorChild);
    if (key === 'Backspace') {
      const prev = editorChild.previousSibling;
      return !!(prev instanceof Element && prev.matches(this.BLOCK_SEL) &&
                range.compareBoundaryPoints(Range.START_TO_START, r) <= 0);
    } else {
      const next = editorChild.nextSibling;
      return !!(next instanceof Element && next.matches(this.BLOCK_SEL) &&
                range.compareBoundaryPoints(Range.START_TO_END, r) >= 0);
    }
  }

  private updateActiveFormats() {
    if (!this.focused) return;
    const active = new Set<string>();
    for (const [tag, cmd] of Object.entries(FORMAT_COMMANDS)) {
      if (document.queryCommandState(cmd)) active.add(tag);
    }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).startContainer;
      while (node && node !== this.editorEl.nativeElement) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.classList.contains('wysiwyg-code')) { active.add('code'); break; }
          if (el.tagName === 'BLOCKQUOTE') { active.add('quote'); break; }
          if (el.classList.contains('wysiwyg-spoiler')) { active.add('spoiler'); break; }
        }
        node = node.parentNode;
      }
    }
    this.activeFormats.set(active);
    this.updateInlineStyles();
  }

  private updateInlineStyles(): void {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    let node: Node | null = sel.getRangeAt(0).startContainer;
    let color: string | null = null;
    let fontSize: number | null = null;
    let fontFamily: string | null = null;

    while (node && node !== this.editorEl.nativeElement) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (color === null) {
          const c = el.tagName === 'FONT' ? el.getAttribute('color') : el.style.color;
          if (c) color = c;
        }
        if (fontSize === null && el.style.fontSize) {
          fontSize = parseInt(el.style.fontSize);
        }
        if (fontFamily === null) {
          const f = el.tagName === 'FONT' ? el.getAttribute('face') : el.style.fontFamily;
          if (f) fontFamily = f.replace(/['"]/g, '').split(',')[0].trim();
        }
      }
      node = node.parentNode;
    }

    this.activeColor.set(color ? this.normalizeColor(color) : null);
    this.activeFontSize.set(fontSize);
    this.activeFontFamily.set(fontFamily?.toLowerCase() ?? null);
  }

  private normalizeColor(color: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Emitted on every input so the parent can react (e.g. mention detection)
  onInput: () => void = () => {};

  get nativeElement(): HTMLDivElement { return this.editorEl.nativeElement; }

  getValue(): string {
    return htmlToBbCode(this.editorEl.nativeElement.innerHTML);
  }

  setValue(bbCode: string): void {
    this.editorEl.nativeElement.innerHTML = bbCodeToHtml(bbCode);
    this.sanitizeCodeBlocks();
  }

  // After any innerHTML assignment, convert the content of every code-block <pre>
  // to plain text. This removes any rendered HTML (img, a, etc.) that slipped in
  // regardless of how it got there (bbCodeToHtml, paste, drag-drop, etc.).
  private sanitizeCodeBlocks(): void {
    this.editorEl.nativeElement.querySelectorAll<HTMLElement>('.wysiwyg-code pre').forEach(pre => {
      if (!pre.querySelector('img, a, b, i, u, s, del, font, span')) return;
      const parts: string[] = [];
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          parts.push(node.textContent ?? '');
        } else if ((node as HTMLElement).tagName?.toLowerCase() === 'br') {
          parts.push('\n');
        } else {
          node.childNodes.forEach(walk);
        }
      };
      pre.childNodes.forEach(walk);
      pre.textContent = parts.join('');
    });
  }

  clear(): void { this.editorEl.nativeElement.innerHTML = ''; }

  focus(): void {
    const el = this.editorEl.nativeElement;
    if (document.activeElement === el) {
      // Already focused — onFocus won't re-fire, so refresh formats manually.
      // This happens after programmatic DOM changes like unwrapBlock.
      this.updateActiveFormats();
    } else {
      el.focus(); // onFocus → updateActiveFormats
    }
  }

  unwrapBlock(containerSelector: string, contentSelector?: string): void {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== this.editorEl.nativeElement) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).matches(containerSelector)) {
        const container = node as HTMLElement;
        const source = contentSelector ? container.querySelector(contentSelector) : container;
        const fragment = document.createDocumentFragment();
        if (source) Array.from(source.childNodes).forEach(n => fragment.appendChild(n.cloneNode(true)));
        container.replaceWith(fragment);
        return;
      }
      node = node.parentNode;
    }
  }

  private savedRange: Range | null = null;

  saveSelection(): void {
    const sel = window.getSelection();
    this.savedRange = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
  }

  restoreSelection(): void {
    if (!this.savedRange) return;
    this.editorEl.nativeElement.focus();
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(this.savedRange); }
  }

  exec(command: string, value?: string): void {
    this.editorEl.nativeElement.focus();
    document.execCommand(command, false, value ?? undefined);
    this.updateActiveFormats();
  }

  insertHtmlAtCursor(html: string): void {
    this.editorEl.nativeElement.focus();
    document.execCommand('insertHTML', false, html);
  }

  // cursorSelector: CSS selector (relative to the inserted nodes) for where to
  // place the cursor after insertion. Defaults to the trailing empty div.
  insertBlockAtCursor(html: string, cursorSelector?: string): void {
    const editor = this.editorEl.nativeElement;
    // Restore the cursor to where it was before the toolbar button click blurred
    // the editor. Plain focus() refocuses but does not necessarily restore the
    // selection, so the wrong blockAncestor would be picked.
    this.restoreSelection();
    if (document.activeElement !== editor) editor.focus();

    const temp = document.createElement('div');
    temp.innerHTML = html;
    const nodes: Node[] = Array.from(temp.childNodes);

    const sel = window.getSelection();

    if (!sel || !sel.rangeCount) {
      nodes.forEach(n => editor.appendChild(n));
    } else {
      const range = sel.getRangeAt(0);

      let blockAncestor: Node | null = range.startContainer;
      while (blockAncestor && blockAncestor.parentNode !== editor) {
        blockAncestor = blockAncestor.parentNode;
      }

      if (blockAncestor) {
        // If the block containing the cursor is empty, replace it so we don't
        // leave a spurious empty line before the newly inserted block.
        const el = blockAncestor as HTMLElement;
        const isEmpty = el.nodeType === Node.ELEMENT_NODE && el.textContent === '';

        if (isEmpty) {
          editor.replaceChild(nodes[0], blockAncestor);
          let ref: Node = nodes[0];
          for (let i = 1; i < nodes.length; i++) {
            editor.insertBefore(nodes[i], ref.nextSibling);
            ref = nodes[i];
          }
        } else {
          let ref = blockAncestor;
          for (const n of nodes) {
            editor.insertBefore(n, ref.nextSibling);
            ref = n;
          }
        }
      } else {
        nodes.forEach(n => editor.appendChild(n));
      }
    }

    this.sanitizeCodeBlocks();

    // Place cursor at cursorSelector inside the new block, or the trailing div
    let cursorTarget: Node = nodes[nodes.length - 1];
    if (cursorSelector) {
      for (const n of nodes) {
        if (n instanceof Element) {
          const found = n.matches(cursorSelector) ? n : n.querySelector(cursorSelector);
          if (found) { cursorTarget = found; break; }
        }
      }
    }
    if (sel) {
      const newRange = document.createRange();
      newRange.setStart(cursorTarget, 0);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  }

  insertTextAtCursor(text: string): void {
    this.editorEl.nativeElement.focus();
    document.execCommand('insertText', false, text);
  }

  // Extend selection backwards by charsToDelete, then replace with text in one operation.
  replaceBeforeCursor(charsToDelete: number, text: string): void {
    this.editorEl.nativeElement.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(false);
    const node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      range.setStart(node, Math.max(0, range.startOffset - charsToDelete));
    }
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('insertText', false, text);
  }

  appendText(text: string): void {
    const el = this.editorEl.nativeElement;
    el.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.selectAllChildren(el);
      sel.collapseToEnd();
    }
    document.execCommand('insertText', false, text);
  }

  // Returns the plain text content of the editor before the current cursor
  getTextBeforeCursor(): string {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return '';
    const range = sel.getRangeAt(0).cloneRange();
    range.selectNodeContents(this.editorEl.nativeElement);
    range.setEnd(sel.anchorNode!, sel.anchorOffset);
    return range.toString();
  }

  onPaste(event: ClipboardEvent): void {
    const sel = window.getSelection();
    const node = sel?.rangeCount ? sel.getRangeAt(0).startContainer : null;
    const el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement | null;
    if (el?.closest('.wysiwyg-code')) {
      event.preventDefault();
      const text = event.clipboardData?.getData('text/plain') ?? '';
      document.execCommand('insertText', false, text);
      return;
    }

    if (!this.canUpload()) return;
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFiles = Array.from(items)
      .filter(i => i.type.startsWith('image/'))
      .map(i => i.getAsFile())
      .filter((f): f is File => f != null);

    if (imageFiles.length === 0) return;
    event.preventDefault();
    this.uploadFiles(imageFiles);
  }

  onDragOver(event: DragEvent): void {
    if (!this.canUpload()) return;
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    if (!this.canUpload()) return;
    event.preventDefault();
    const imageFiles = Array.from(event.dataTransfer?.files ?? [])
      .filter(f => f.type.startsWith('image/'));
    this.uploadFiles(imageFiles);
  }

  private uploadFiles(files: File[]): void {
    for (const file of files) {
      const placeholder = document.createElement('span');
      placeholder.className = 'wysiwyg-upload-placeholder';
      placeholder.textContent = '⏳';

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(placeholder);
        range.setStartAfter(placeholder);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        this.editorEl.nativeElement.appendChild(placeholder);
      }

      this.imageService.upload(file).subscribe({
        next: (res) => {
          const img = document.createElement('img');
          img.src = res.url;
          placeholder.replaceWith(img);
        },
        error: () => placeholder.remove(),
      });
    }
  }
}
