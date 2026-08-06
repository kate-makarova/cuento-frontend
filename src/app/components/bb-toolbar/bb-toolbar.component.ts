import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { GridBuilderComponent } from '../grid-builder/grid-builder.component';
import { ApiService } from '../../services/api.service';
import { SmileCategoryWithSmiles } from '../../models/Smile';
import { WysiwygEditorComponent } from '../wysiwyg-editor/wysiwyg-editor.component';

@Component({
  selector: 'app-bb-toolbar',
  standalone: true,
  imports: [CommonModule, ImageUploadComponent, GridBuilderComponent],
  templateUrl: './bb-toolbar.component.html',
})
export class BbToolbarComponent {
  private apiService = inject(ApiService);

  @Input() textarea: HTMLTextAreaElement | null = null;
  @Input() editor: WysiwygEditorComponent | null = null;
  @Input() showSpoiler = true;
  @Input() showImageUpload = true;

  activeArea: string | null = null;
  showSpoilerModal = false;
  private spoilerSelStart = 0;
  private spoilerSelEnd = 0;
  private urlSelStart = 0;
  private urlSelEnd = 0;

  smileCategories = signal<SmileCategoryWithSmiles[]>([]);
  private smilesLoaded = false;

  fonts = ['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New', 'Impact'];
  colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'gray', 'silver'];

  toggleArea(area: string) {
    this.activeArea = this.activeArea === area ? null : area;
    if (this.activeArea === 'url') {
      if (this.editor) {
        this.editor.saveSelection();
      } else if (this.textarea) {
        this.urlSelStart = this.textarea.selectionStart;
        this.urlSelEnd = this.textarea.selectionEnd;
      }
    }
    if (area === 'smile' && this.activeArea === 'smile' && !this.smilesLoaded) {
      this.smilesLoaded = true;
      this.apiService.get<SmileCategoryWithSmiles[]>('smiles').subscribe({
        next: (data) => this.smileCategories.set(data),
        error: (err) => console.error('Failed to load smiles', err)
      });
    }
  }

  insertUrl(url: string, linkText: string) {
    if (!url) { this.activeArea = null; return; }
    if (this.editor) {
      this.editor.restoreSelection();
      if (linkText) {
        this.editor.insertHtmlAtCursor(`<a href="${url}">${linkText}</a>`);
      } else {
        this.editor.exec('createLink', url);
      }
      this.activeArea = null;
      return;
    }
    if (!this.textarea) return;
    const text = this.textarea.value;
    const selected = text.substring(this.urlSelStart, this.urlSelEnd);
    const label = linkText || selected || url;
    const tag = `[url=${url}]${label}[/url]`;
    this.textarea.value = text.substring(0, this.urlSelStart) + tag + text.substring(this.urlSelEnd);
    this.activeArea = null;
    this.textarea.focus();
    this.textarea.setSelectionRange(this.urlSelStart + tag.length, this.urlSelStart + tag.length);
  }

  isFormatActive(tag: string): boolean {
    return this.editor?.activeFormats().has(tag) ?? false;
  }

  insertTag(tag: string) {
    if (this.editor) {
      this.insertTagWysiwyg(tag);
      return;
    }
    if (!this.textarea) return;

    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const tagBase = tag.split('=')[0];
    const openTag = `[${tag}]`;
    const closeTag = `[/${tagBase}]`;

    const selectedText = text.substring(start, end);
    textarea.value = text.substring(0, start) + openTag + selectedText + closeTag + text.substring(end);

    textarea.focus();
    const newPos = start + openTag.length + selectedText.length;
    textarea.setSelectionRange(newPos, newPos);
  }

  private insertTagWysiwyg(tag: string) {
    const ed = this.editor!;
    switch (tag) {
      case 'b':      ed.exec('bold'); break;
      case 'i':      ed.exec('italic'); break;
      case 'u':      ed.exec('underline'); break;
      case 's':      ed.exec('strikeThrough'); break;
      case 'left':   ed.exec('justifyLeft'); break;
      case 'center': ed.exec('justifyCenter'); break;
      case 'right':  ed.exec('justifyRight'); break;
      case 'quote': ed.exec('formatBlock', 'blockquote'); break;
      case 'code':  ed.exec('formatBlock', 'pre'); break;
      case 'video':
      case 'audio':
        ed.insertTextAtCursor(`[${tag}][/${tag}]`);
        break;
      default: {
        if (tag.startsWith('font='))  { ed.exec('fontName', tag.slice(5)); break; }
        if (tag.startsWith('color=')) { ed.exec('foreColor', tag.slice(6)); break; }
        if (tag.startsWith('size=')) {
          const sizePx = tag.slice(5);
          ed.insertHtmlAtCursor(`<span style="font-size:${sizePx}px">&#8203;</span>`);
          break;
        }
        ed.insertTextAtCursor(`[${tag}][/${tag.split('=')[0]}]`);
      }
    }
  }

  openSpoilerModal() {
    if (this.editor) {
      this.showSpoilerModal = true;
      return;
    }
    if (!this.textarea) return;
    this.spoilerSelStart = this.textarea.selectionStart;
    this.spoilerSelEnd = this.textarea.selectionEnd;
    this.showSpoilerModal = true;
  }

  insertSpoiler(title: string) {
    if (this.editor) {
      const caption = title || 'Spoiler';
      const dataTitleAttr = title ? ` data-title="${title}"` : '';
      this.editor.insertBlockAtCursor(
        `<div class="wysiwyg-spoiler"${dataTitleAttr}><div class="wysiwyg-spoiler-header">${caption}</div><div class="wysiwyg-spoiler-content">&nbsp;</div></div><div><br></div>`
      );
      this.showSpoilerModal = false;
      this.editor.focus();
      return;
    }
    if (!this.textarea) return;
    const textarea = this.textarea;
    const text = textarea.value;
    const selectedText = text.substring(this.spoilerSelStart, this.spoilerSelEnd);
    const tag = `[spoiler=${title}]${selectedText}[/spoiler]`;
    textarea.value = text.substring(0, this.spoilerSelStart) + tag + text.substring(this.spoilerSelEnd);
    this.showSpoilerModal = false;
    textarea.focus();
    textarea.setSelectionRange(this.spoilerSelStart + tag.length, this.spoilerSelStart + tag.length);
  }

  insertGrid(bbCode: string) {
    if (this.editor) {
      this.editor.insertTextAtCursor(bbCode);
      this.activeArea = null;
      this.editor.focus();
      return;
    }
    if (!this.textarea) return;
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const text = textarea.value;
    textarea.value = text.substring(0, start) + bbCode + text.substring(start);
    this.activeArea = null;
    textarea.focus();
    textarea.setSelectionRange(start + bbCode.length, start + bbCode.length);
  }

  onInsertImage(url: string) {
    if (this.editor) {
      this.editor.insertHtmlAtCursor(`<img src="${url}" style="max-width:100%">`);
      this.activeArea = null;
      return;
    }
    if (!this.textarea) return;
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const text = textarea.value;
    const tag = `[img]${url}[/img]`;
    textarea.value = text.substring(0, start) + tag + text.substring(start);
    textarea.focus();
    textarea.setSelectionRange(start + tag.length, start + tag.length);
  }

  insertSmile(url: string) {
    if (this.editor) {
      this.editor.insertHtmlAtCursor(`<img src="${url}" class="smile">`);
      this.activeArea = null;
      return;
    }
    if (!this.textarea) return;
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const text = textarea.value;
    const tag = `[img]${url}[/img]`;
    textarea.value = text.substring(0, start) + tag + text.substring(start);
    textarea.focus();
    textarea.setSelectionRange(start + tag.length, start + tag.length);
  }
}
