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

  onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const anchor = sel.getRangeAt(0).commonAncestorContainer;
    const node = anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor as HTMLElement;
    if (node?.closest('.wysiwyg-spoiler-content, .wysiwyg-code, blockquote')) {
      event.preventDefault();
      document.execCommand('insertLineBreak');
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

  focus(): void { this.editorEl.nativeElement.focus(); }

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

  insertBlockAtCursor(html: string): void {
    const editor = this.editorEl.nativeElement;
    editor.focus();

    const temp = document.createElement('div');
    temp.innerHTML = html;
    const nodes: Node[] = Array.from(temp.childNodes);

    const sel = window.getSelection();

    if (!sel || !sel.rangeCount) {
      nodes.forEach(n => editor.appendChild(n));
    } else {
      const range = sel.getRangeAt(0);

      // Walk up to the direct child of the editor that contains the cursor
      let blockAncestor: Node | null = range.startContainer;
      while (blockAncestor && blockAncestor.parentNode !== editor) {
        blockAncestor = blockAncestor.parentNode;
      }

      if (blockAncestor) {
        let ref = blockAncestor;
        for (const n of nodes) {
          editor.insertBefore(n, ref.nextSibling);
          ref = n;
        }
      } else {
        nodes.forEach(n => editor.appendChild(n));
      }
    }

    this.sanitizeCodeBlocks();

    // Place cursor inside the trailing empty div
    const last = nodes[nodes.length - 1];
    if (last && sel) {
      const newRange = document.createRange();
      newRange.setStart(last, 0);
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
