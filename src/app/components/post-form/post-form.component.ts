import { Component, Input, ViewChild, AfterViewInit, inject, OnDestroy, signal, ElementRef } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { UserService } from '../../services/user.service';
import { UserShort } from '../../models/UserShort';
import { CommonModule } from '@angular/common';
import { BbToolbarComponent } from '../bb-toolbar/bb-toolbar.component';
import { WysiwygEditorComponent } from '../wysiwyg-editor/wysiwyg-editor.component';

type EditorMode = 'wysiwyg' | 'bbcode';
const EDITOR_MODE_KEY = 'postEditorMode';

@Component({
  selector: 'app-post-form',
  imports: [CommonModule, BbToolbarComponent, WysiwygEditorComponent],
  templateUrl: './post-form.component.html',
  standalone: true,
})
export class PostFormComponent implements AfterViewInit, OnDestroy {
  @ViewChild('wysiwygEditor') wysiwygEditor?: WysiwygEditorComponent;
  @ViewChild('messageField') messageField?: ElementRef<HTMLTextAreaElement>;

  get textareaEl(): HTMLTextAreaElement | null {
    return this.messageField?.nativeElement ?? null;
  }

  @Input() initialContent: string = '';
  @Input() isEpisode: boolean = false;

  private userService = inject(UserService);

  editorMode = signal<EditorMode>(
    (localStorage.getItem(EDITOR_MODE_KEY) as EditorMode | null) ?? 'wysiwyg'
  );

  mentionResults: UserShort[] = [];
  private mentionAtPos: number = -1;
  private mentionSubject = new Subject<string>();
  private mentionSub: Subscription;

  constructor() {
    this.mentionSub = this.mentionSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => term.length >= 1 ? this.userService.searchUsers(term) : [])
    ).subscribe(results => {
      this.mentionResults = results;
    });
  }

  ngAfterViewInit() {
    if (this.wysiwygEditor) {
      this.wysiwygEditor.onInput = () => this.onWysiwygInput();
    }
    if (this.initialContent) {
      this.setValue(this.initialContent);
    }
  }

  ngOnDestroy() {
    this.mentionSub.unsubscribe();
  }

  // --- Public API used by viewtopic ---

  getValue(): string {
    if (this.editorMode() === 'wysiwyg') {
      return this.wysiwygEditor?.getValue() ?? '';
    }
    return this.messageField?.nativeElement.value ?? '';
  }

  setValue(content: string): void {
    if (this.editorMode() === 'wysiwyg') {
      this.wysiwygEditor?.setValue(content);
    } else {
      if (this.messageField) this.messageField.nativeElement.value = content;
    }
  }

  clear(): void {
    this.wysiwygEditor?.clear();
    if (this.messageField) this.messageField.nativeElement.value = '';
  }

  focus(): void {
    if (this.editorMode() === 'wysiwyg') {
      this.wysiwygEditor?.focus();
    } else {
      this.messageField?.nativeElement.focus();
    }
  }

  appendText(text: string): void {
    if (this.editorMode() === 'wysiwyg') {
      this.wysiwygEditor?.appendText(text);
    } else {
      const el = this.messageField?.nativeElement;
      if (el) { el.value += text; el.focus(); }
    }
  }

  insertAtCursor(text: string): void {
    if (this.editorMode() === 'wysiwyg') {
      this.wysiwygEditor?.insertTextAtCursor(text);
    } else {
      const el = this.messageField?.nativeElement;
      if (!el) return;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      el.value = el.value.substring(0, start) + text + el.value.substring(end);
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    }
  }

  switchMode(): void {
    const content = this.getValue();
    const next: EditorMode = this.editorMode() === 'wysiwyg' ? 'bbcode' : 'wysiwyg';
    this.editorMode.set(next);
    localStorage.setItem(EDITOR_MODE_KEY, next);
    this.setValue(content);
  }

  // --- Internal ---

  onTextareaInput(): void {
    if (this.isEpisode) return;
    const el = this.messageField?.nativeElement;
    if (!el) return;
    const textBefore = el.value.substring(0, el.selectionStart ?? 0);
    const match = textBefore.match(/@([^ @]*)$/);
    if (match) {
      this.mentionAtPos = textBefore.length - match[0].length;
      this.mentionSubject.next(match[1]);
    } else {
      this.mentionResults = [];
      this.mentionAtPos = -1;
    }
  }

  private onWysiwygInput() {
    if (this.isEpisode) return;
    const textBefore = this.wysiwygEditor?.getTextBeforeCursor() ?? '';
    const match = textBefore.match(/@([^ @]*)$/);
    if (match) {
      this.mentionAtPos = textBefore.length - match[0].length;
      this.mentionSubject.next(match[1]);
    } else {
      this.mentionResults = [];
      this.mentionAtPos = -1;
    }
  }

  selectMention(user: UserShort) {
    const inserted = `${user.username} , `;
    if (this.editorMode() === 'wysiwyg') {
      this.wysiwygEditor?.insertTextAtCursor(inserted);
    } else {
      this.insertAtCursor(inserted);
    }
    this.mentionResults = [];
    this.mentionAtPos = -1;
  }

  closeMention() {
    this.mentionResults = [];
    this.mentionAtPos = -1;
  }
}
