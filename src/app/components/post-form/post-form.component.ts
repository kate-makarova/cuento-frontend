import { Component, computed, ElementRef, Input, ViewChild, AfterViewInit, inject, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { UserService } from '../../services/user.service';
import { UserShort } from '../../models/UserShort';
import { CommonModule } from '@angular/common';
import { BbToolbarComponent } from '../bb-toolbar/bb-toolbar.component';
import { BoardService } from '../../services/board.service';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-post-form',
  imports: [CommonModule, BbToolbarComponent],
  templateUrl: './post-form.component.html',
  standalone: true,
})
export class PostFormComponent implements AfterViewInit, OnDestroy {
  @ViewChild('messageField') messageField!: ElementRef<HTMLTextAreaElement>;
  @Input() initialContent: string = '';
  @Input() isEpisode: boolean = false;

  private userService = inject(UserService);
  private boardService = inject(BoardService);
  private imageService = inject(ImageService);

  readonly canUpload = computed(() => this.boardService.board().use_image_uploading === 'y');

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
    if (this.initialContent) {
      this.messageField.nativeElement.value = this.initialContent;
    }
  }

  ngOnDestroy() {
    this.mentionSub.unsubscribe();
  }

  onTextareaInput() {
    if (this.isEpisode) return;

    const textarea = this.messageField.nativeElement;
    const cursor = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursor);

    const match = textBeforeCursor.match(/@([^\u200A@]*)$/);
    if (match) {
      this.mentionAtPos = cursor - match[0].length;
      this.mentionSubject.next(match[1]);
    } else {
      this.mentionResults = [];
      this.mentionAtPos = -1;
    }
  }

  selectMention(user: UserShort) {
    const textarea = this.messageField.nativeElement;
    const cursor = textarea.selectionStart;
    const text = textarea.value;

    const before = text.substring(0, this.mentionAtPos);
    const after = text.substring(cursor);
    const inserted = `@${user.username}\u200A, `;

    textarea.value = before + inserted + after;
    const newPos = this.mentionAtPos + inserted.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    });

    this.mentionResults = [];
    this.mentionAtPos = -1;
  }

  onPaste(event: ClipboardEvent) {
    if (!this.canUpload()) return;
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFiles = Array.from(items)
      .filter(item => item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((f): f is File => f != null);

    if (imageFiles.length === 0) return;
    event.preventDefault();

    const textarea = this.messageField.nativeElement;
    for (const file of imageFiles) {
      const placeholderId = `uploading_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const placeholder = `[${placeholderId}]`;
      const pos = textarea.selectionStart;
      textarea.value = textarea.value.substring(0, pos) + placeholder + textarea.value.substring(pos);
      textarea.setSelectionRange(pos + placeholder.length, pos + placeholder.length);

      this.imageService.upload(file).subscribe({
        next: (res) => {
          const tag = `[img]${res.url}[/img]`;
          const idx = textarea.value.indexOf(placeholder);
          if (idx !== -1) {
            textarea.value = textarea.value.substring(0, idx) + tag + textarea.value.substring(idx + placeholder.length);
          }
        },
        error: () => {
          const idx = textarea.value.indexOf(placeholder);
          if (idx !== -1) {
            textarea.value = textarea.value.substring(0, idx) + textarea.value.substring(idx + placeholder.length);
          }
        }
      });
    }
  }

  closeMention() {
    this.mentionResults = [];
    this.mentionAtPos = -1;
  }
}
