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

  private focused = false;
  private selectionHandler = () => this.updateActiveFormats();

  constructor() {
    document.addEventListener('selectionchange', this.selectionHandler);
  }

  ngOnDestroy() {
    document.removeEventListener('selectionchange', this.selectionHandler);
  }

  onFocus() { this.focused = true; this.updateActiveFormats(); }
  onBlur()  { this.focused = false; }

  onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const anchor = sel.getRangeAt(0).commonAncestorContainer;
    const node = anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor as HTMLElement;
    if (node?.closest('.wysiwyg-spoiler-content')) {
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
    this.activeFormats.set(active);
  }

  // Emitted on every input so the parent can react (e.g. mention detection)
  onInput: () => void = () => {};

  get nativeElement(): HTMLDivElement { return this.editorEl.nativeElement; }

  getValue(): string {
    return htmlToBbCode(this.editorEl.nativeElement.innerHTML);
  }

  setValue(bbCode: string): void {
    this.editorEl.nativeElement.innerHTML = bbCodeToHtml(bbCode);
  }

  clear(): void { this.editorEl.nativeElement.innerHTML = ''; }

  focus(): void { this.editorEl.nativeElement.focus(); }

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
      const id = `up_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      this.insertHtmlAtCursor(`<span id="${id}" class="wysiwyg-upload-placeholder">⏳</span>`);

      this.imageService.upload(file).subscribe({
        next: (res) => {
          const el = this.editorEl.nativeElement.querySelector(`#${id}`);
          if (el) {
            const img = document.createElement('img');
            img.src = res.url;
            el.replaceWith(img);
          }
        },
        error: () => this.editorEl.nativeElement.querySelector(`#${id}`)?.remove(),
      });
    }
  }
}
