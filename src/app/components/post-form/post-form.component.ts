import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit, inject, OnDestroy, OnInit, signal, computed, ElementRef } from '@angular/core';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';
import { BoardService } from '../../services/board.service';
import { ApiService } from '../../services/api.service';
import { CharacterService } from '../../services/character.service';
import { ArcService } from '../../services/arc.service';
import { UserShort } from '../../models/UserShort';
import { ArcNpc } from '../../models/StoryArc';

import { BbToolbarComponent } from '../bb-toolbar/bb-toolbar.component';
import { WysiwygDocEditorComponent } from '../wysiwyg-editor/wysiwyg-doc-editor.component';
import { FormsModule } from '@angular/forms';

type EditorMode = 'wysiwyg' | 'bbcode';
type AutosaveStatus = 'idle' | 'typing' | 'saving' | 'saved';

interface PostDraft {
  id: number;
  draft_id: string;
  user_id: number;
  character_id: number;
  topic_id: number;
  date_created: string;
  is_manual: boolean;
  is_published: boolean;
  post_id: number | null;
}

@Component({
  selector: 'app-post-form',
  imports: [ FormsModule, BbToolbarComponent, WysiwygDocEditorComponent],
  templateUrl: './post-form.component.html',
  styleUrl: './post-form.component.css',
  standalone: true,
})
export class PostFormComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('wysiwygEditor') wysiwygEditor?: WysiwygDocEditorComponent;
  @ViewChild('messageField') messageField?: ElementRef<HTMLTextAreaElement>;

  get textareaEl(): HTMLTextAreaElement | null {
    return this.messageField?.nativeElement ?? null;
  }

  @Input() initialContent: string = '';
  @Input() isEpisode: boolean = false;
  @Input() isGm: boolean = false;
  @Input() arcId: number | null = null;
  @Input() episodeId: number | null = null;
  @Input() topicId: number | null = null;
  @Input() characterId: number | null = null;
  @Output() characterIdChange = new EventEmitter<number | null>();

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private imageService = inject(ImageService);
  private boardService = inject(BoardService);
  private apiService = inject(ApiService);
  private characterService = inject(CharacterService);
  private arcService = inject(ArcService);

  editorMode = signal<EditorMode>(
    this.authService.currentUser()?.editor_type === 1 ? 'bbcode' : 'wysiwyg'
  );

  // Draft state
  drafts = signal<PostDraft[]>([]);
  showDraftList = signal(false);
  autosaveStatus = signal<AutosaveStatus>('idle');
  private autoDraftId = signal<number | null>(null);

  autosaveEnabled = signal(true);
  loadedDraftId = signal<number | null>(null);
  currentDraftGroupId = signal<string | null>(null);

  autoDraftCount = computed(() => this.drafts().filter(d => !d.is_manual).length);
  manualDraftCount = computed(() => this.drafts().filter(d => d.is_manual).length);

  // Mention state
  mentionResults: UserShort[] = [];
  private mentionAtPos: number = -1;
  private mentionSubject = new Subject<string>();
  private mentionSub: Subscription;

  // Hide panel state
  showHidePanel = signal(false);
  hideSearch = signal('');
  hideSearchResults = signal<UserShort[]>([]);
  selectedHideUsers = signal<UserShort[]>([]);
  showHideDropdown = signal(false);
  filteredHideResults = computed(() => {
    const selectedIds = new Set(this.selectedHideUsers().map(u => u.id));
    return this.hideSearchResults().filter(u => !selectedIds.has(u.id));
  });
  private hideSearchSubject = new Subject<string>();
  private hideSearchSub?: Subscription;

  // NPC panel state
  showNpcPanel = signal(false);
  npcSearch = signal('');
  npcSearchResults = signal<ArcNpc[]>([]);
  selectedNpcs = signal<ArcNpc[]>([]);
  showNpcDropdown = signal(false);
  filteredNpcResults = computed(() => {
    const selectedIds = new Set(this.selectedNpcs().map(n => n.id));
    return this.npcSearchResults().filter(n => !selectedIds.has(n.id));
  });
  private npcSearchSubject = new Subject<string>();
  private npcSearchSub?: Subscription;

  // Autosave
  private autosaveSubject = new Subject<string>();
  private autosaveSub?: Subscription;
  private savedClearTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.mentionSub = this.mentionSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => term.length >= 1 ? this.userService.searchUsers(term) : [])
    ).subscribe(results => {
      this.mentionResults = results;
    });

    this.npcSearchSub = this.npcSearchSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => this.arcId != null ? this.arcService.searchNpcs(this.arcId, term) : of([]))
    ).subscribe(results => {
      this.npcSearchResults.set(results);
    });

    this.hideSearchSub = this.hideSearchSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => term.length >= 1 && this.episodeId != null
        ? this.apiService.get<UserShort[]>(`user/autocomplete/${encodeURIComponent(term)}?episode_id=${this.episodeId}`)
        : of([]))
    ).subscribe(results => {
      this.hideSearchResults.set(results);
    });
  }

  protected isAuthenticated = this.authService.isAuthenticated;

  ngOnInit() {
    if (this.topicId && this.authService.isAuthenticated()) {
      this.loadDrafts(true);
      this.autosaveSub = this.autosaveSubject.pipe(debounceTime(3000)).subscribe(content => {
        this.autosaveStatus.set('saving');
        this.saveAutoDraft(content);
      });
    }
  }

  private saveAutoDraft(content: string) {
    const existingId = this.autoDraftId();
    const onError = () => this.autosaveStatus.set('idle');

    if (!content.trim() && existingId) {
      this.apiService.get(`post-draft/delete/${existingId}`).subscribe({
        next: () => {
          this.autoDraftId.set(null);
          if (this.loadedDraftId() === existingId) this.loadedDraftId.set(null);
          if (this.drafts().filter(d => d.id !== existingId).length === 0) this.currentDraftGroupId.set(null);
          this.autosaveStatus.set('idle');
          this.loadDrafts();
        },
        error: onError,
      });
      return;
    }

    if (!content.trim()) {
      this.autosaveStatus.set('idle');
      return;
    }

    const onSuccess = (data: PostDraft) => {
      this.autoDraftId.set(data.id);
      this.currentDraftGroupId.set(data.draft_id);
      this.drafts.update(current => {
        const without = current.filter(d => d.id !== data.id);
        return [data, ...without];
      });
      this.autosaveStatus.set('saved');
      this.loadDrafts();
      this.savedClearTimer = setTimeout(() => this.autosaveStatus.set('idle'), 3000);
    };

    if (!existingId) {
      this.apiService.post<PostDraft>('post-draft/create', {
        character_id: this.draftCharacterId(),
        topic_id: this.topicId,
        is_manual: false,
        content,
      }).subscribe({ next: onSuccess, error: onError });
    } else {
      this.apiService.post<PostDraft>(`post-draft/update/${existingId}`, {
        character_id: this.draftCharacterId(),
        topic_id: this.topicId,
        is_manual: false,
        content,
      }).subscribe({ next: onSuccess, error: onError });
    }
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
    this.autosaveSub?.unsubscribe();
    this.npcSearchSub?.unsubscribe();
    this.hideSearchSub?.unsubscribe();
    if (this.savedClearTimer) clearTimeout(this.savedClearTimer);
  }

  // --- Draft API ---

  private loadDrafts(autoLoad = false) {
    if (!this.topicId) return;
    this.apiService.get<PostDraft[]>(`post-draft/topic/${this.topicId}/latest`).subscribe({
      next: data => {
        this.drafts.set(data);
        const autoDraft = data.find(d => !d.is_manual);
        if (autoDraft) {
          const isFirstLoad = !this.autoDraftId();
          if (isFirstLoad) this.autoDraftId.set(autoDraft.id);
          if (!this.loadedDraftId()) {
            this.loadedDraftId.set(autoDraft.id);
            this.currentDraftGroupId.set(autoDraft.draft_id);
          }
          if (autoLoad && isFirstLoad) this.loadDraft(autoDraft);
        }
      },
      error: () => {},
    });
  }

  toggleDraftList() {
    this.showDraftList.update(v => !v);
  }

  saveManualDraft() {
    const autoDraft = this.drafts().find(d => !d.is_manual);
    this.apiService.post<PostDraft>('post-draft/create', {
      draft_id: autoDraft?.draft_id,
      character_id: this.draftCharacterId(),
      topic_id: this.topicId,
      is_manual: true,
      content: this.getValue(),
    }).subscribe({
      next: () => this.loadDrafts(),
      error: err => console.error('Failed to save manual draft', err),
    });
  }

  loadDraft(draft: PostDraft) {
    this.apiService.get<PostDraft & { content: string }>(`post-draft/${draft.id}`).subscribe({
      next: data => {
        this.setValue(data.content);
        this.loadedDraftId.set(draft.id);
        this.currentDraftGroupId.set(data.draft_id);
        this.characterIdChange.emit(this.profileIdFromCharacterId(data.character_id));
        this.showDraftList.set(false);
      },
      error: err => console.error('Failed to load draft', err),
    });
  }

  deleteDraft(draft: PostDraft) {
    this.apiService.get(`post-draft/delete/${draft.id}`).subscribe({
      next: () => {
        if (this.loadedDraftId() === draft.id) this.loadedDraftId.set(null);
        this.loadDrafts();
      },
      error: err => console.error('Failed to delete draft', err),
    });
  }

  deleteDraftGroup() {
    const draftId = this.drafts()[0]?.draft_id;
    if (!draftId) return;
    this.apiService.get(`post-draft/delete-group/${draftId}`).subscribe({
      next: () => {
        this.drafts.set([]);
        this.autoDraftId.set(null);
        this.loadedDraftId.set(null);
        this.showDraftList.set(false);
      },
      error: err => console.error('Failed to delete draft group', err),
    });
  }

  updateManualDraft(draft: PostDraft) {
    this.apiService.post<PostDraft>(`post-draft/update/${draft.id}`, {
      character_id: this.draftCharacterId(),
      topic_id: this.topicId,
      is_manual: true,
      content: this.getValue(),
    }).subscribe({
      next: () => this.loadDrafts(),
      error: err => console.error('Failed to update manual draft', err),
    });
  }

  // Returns the character entity ID (CharacterProfile.character_id) for the
  // currently selected profile, for use in draft payloads.
  private draftCharacterId(): number | null {
    if (this.characterId === null) return null;
    const profile = this.characterService.userCharacterProfiles()
      .find(p => p.id === this.characterId);
    return profile?.character_id ?? null;
  }

  // Given a character entity ID returned from a loaded draft, find the
  // CharacterProfile.id so the UI selector can restore the selection.
  private profileIdFromCharacterId(characterEntityId: number | null): number | null {
    if (characterEntityId === null) return null;
    const profile = this.characterService.userCharacterProfiles()
      .find(p => p.character_id === characterEntityId);
    return profile?.id ?? null;
  }

  // --- Public API used by viewtopic ---

  cancelPendingAutosave(): void {
    this.autosaveSub?.unsubscribe();
    this.autosaveStatus.set('idle');
    this.autosaveSub = this.autosaveSubject.pipe(debounceTime(3000)).subscribe(content => {
      this.autosaveStatus.set('saving');
      this.saveAutoDraft(content);
    });
  }

  reloadDrafts(): void {
    this.autoDraftId.set(null);
    this.loadedDraftId.set(null);
    this.currentDraftGroupId.set(null);
    this.loadDrafts();
  }

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

  toggleHidePanel(): void {
    if (this.editorMode() === 'wysiwyg' && this.wysiwygEditor?.activeFormats().has('hide')) {
      this.wysiwygEditor.unwrapBlock('.wysiwyg-hide');
      return;
    }
    if (this.showHidePanel()) {
      this.closeHidePanel();
    } else {
      this.showHidePanel.set(true);
      this.hideSearch.set('');
      this.selectedHideUsers.set([]);
      this.hideSearchSubject.next('');
      this.showHideDropdown.set(false);
    }
  }

  closeHidePanel(): void {
    this.showHidePanel.set(false);
    this.hideSearch.set('');
    this.hideSearchResults.set([]);
    this.selectedHideUsers.set([]);
    this.showHideDropdown.set(false);
  }

  onHideSearchChange(value: string): void {
    this.hideSearch.set(value);
    this.hideSearchSubject.next(value);
    this.showHideDropdown.set(true);
  }

  onHideSearchFocus(): void { this.showHideDropdown.set(true); }

  onHideSearchBlur(): void {
    setTimeout(() => this.showHideDropdown.set(false), 150);
  }

  selectHideUser(user: UserShort): void {
    this.selectedHideUsers.update(list => [...list, user]);
    this.hideSearch.set('');
    this.hideSearchResults.set([]);
    this.showHideDropdown.set(false);
  }

  removeHideUser(user: UserShort): void {
    this.selectedHideUsers.update(list => list.filter(u => u.id !== user.id));
  }

  insertHideBlock(): void {
    const users = this.selectedHideUsers();
    if (!users.length) return;
    if (this.editorMode() === 'wysiwyg' && this.wysiwygEditor) {
      this.wysiwygEditor.insertHideBlockDirect(users.map(u => ({ id: u.id, username: u.username })));
    } else {
      const ids = users.map(u => u.id).join(',');
      this.appendBbCode(`[hide users=${ids}][/hide]`);
    }
    this.closeHidePanel();
  }

  appendBbCode(bbCode: string): void {
    if (this.editorMode() === 'wysiwyg') {
      this.wysiwygEditor?.insertBbCodeBlocks(bbCode);
    } else {
      const el = this.messageField?.nativeElement;
      if (el) { el.value += bbCode; el.focus(); }
    }
  }

  insertAtCursor(text: string): void {
    if (this.editorMode() === 'wysiwyg') {
      this.wysiwygEditor?.restoreSelection();
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
    this.setValue(content);
  }

  // --- Internal ---

  private notifyTyping() {
    if (!this.topicId || !this.autosaveEnabled()) return;
    if (this.savedClearTimer) { clearTimeout(this.savedClearTimer); this.savedClearTimer = null; }
    this.autosaveStatus.set('typing');
    this.autosaveSubject.next(this.getValue());
  }

  onBbKeyDown(event: KeyboardEvent): void {
    if (!event.ctrlKey && !event.metaKey) return;
    const keyChar = event.code?.startsWith('Key')
      ? event.code.slice(3).toLowerCase()
      : event.key.toLowerCase();
    const tagMap: Record<string, string> = { b: 'b', i: 'i', u: 'u', s: 's' };
    const tag = tagMap[keyChar];
    if (!tag) return;
    event.preventDefault();
    const el = this.messageField?.nativeElement;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = el.value.substring(start, end);
    const open = `[${tag}]`, close = `[/${tag}]`;
    el.value = el.value.substring(0, start) + open + selected + close + el.value.substring(end);
    const cursor = selected.length > 0 ? start + open.length + selected.length + close.length : start + open.length;
    el.setSelectionRange(cursor, cursor);
    el.focus();
  }

  onTextareaInput(): void {
    this.notifyTyping();
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
    this.notifyTyping();
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
    const inserted = `${user.username}\u200A`;
    if (this.editorMode() === 'wysiwyg') {
      const textBefore = this.wysiwygEditor?.getTextBeforeCursor() ?? '';
      const charsToDelete = textBefore.length - this.mentionAtPos - 1;
      this.wysiwygEditor?.replaceBeforeCursor(charsToDelete, inserted);
    } else {
      const el = this.messageField?.nativeElement;
      if (!el) return;
      const cursorPos = el.selectionStart ?? el.value.length;
      const replaceFrom = this.mentionAtPos + 1;
      el.value = el.value.substring(0, replaceFrom) + inserted + el.value.substring(cursorPos);
      el.focus();
      el.setSelectionRange(replaceFrom + inserted.length, replaceFrom + inserted.length);
    }
    this.mentionResults = [];
    this.mentionAtPos = -1;
  }

  // --- NPC panel ---

  toggleNpcPanel(): void {
    if (this.editorMode() === 'wysiwyg' && this.wysiwygEditor?.activeFormats().has('npc-block')) {
      this.wysiwygEditor.unwrapBlock('.wysiwyg-npc-block');
      return;
    }
    if (this.showNpcPanel()) {
      this.closeNpcPanel();
    } else {
      this.showNpcPanel.set(true);
      this.npcSearch.set('');
      this.selectedNpcs.set([]);
      this.npcSearchSubject.next('');
      this.showNpcDropdown.set(true);
    }
  }

  closeNpcPanel(): void {
    this.showNpcPanel.set(false);
    this.npcSearch.set('');
    this.npcSearchResults.set([]);
    this.selectedNpcs.set([]);
    this.showNpcDropdown.set(false);
  }

  onNpcSearchChange(value: string): void {
    this.npcSearch.set(value);
    this.npcSearchSubject.next(value);
    this.showNpcDropdown.set(true);
  }

  onNpcSearchFocus(): void {
    this.showNpcDropdown.set(true);
    if (!this.npcSearchResults().length) {
      this.npcSearchSubject.next(this.npcSearch());
    }
  }

  onNpcSearchBlur(): void {
    setTimeout(() => this.showNpcDropdown.set(false), 150);
  }

  selectNpc(npc: ArcNpc): void {
    if (!this.selectedNpcs().some(n => n.id === npc.id)) {
      this.selectedNpcs.update(list => [...list, npc]);
    }
    this.showNpcDropdown.set(false);
  }

  removeNpc(npc: ArcNpc): void {
    this.selectedNpcs.update(list => list.filter(n => n.id !== npc.id));
  }

  insertNpcBlock(): void {
    const npcs = this.selectedNpcs();
    if (!npcs.length) return;
    if (this.editorMode() === 'wysiwyg' && this.wysiwygEditor) {
      this.wysiwygEditor.insertNpcBlockDirect(npcs.map(n => ({ id: n.id, name: n.name, avatar: n.avatar })));
    } else {
      const npcTags = npcs.map(n => `[npc id=${n.id}]`).join('');
      const bb = `[npc-block][npc-header]${npcTags}[/npc-header][npc-body][/npc-body][/npc-block]`;
      this.appendBbCode(bb);
    }
    this.closeNpcPanel();
  }

  closeMention() {
    this.mentionResults = [];
    this.mentionAtPos = -1;
  }

  onTextareaPaste(event: ClipboardEvent): void {
    if (this.boardService.board().use_image_uploading !== 'y') return;
    const files = Array.from(event.clipboardData?.items ?? [])
      .filter(i => i.type.startsWith('image/'))
      .map(i => i.getAsFile())
      .filter((f): f is File => f != null);
    if (files.length === 0) return;
    event.preventDefault();
    this.uploadImagesToTextarea(files);
  }

  onTextareaDragOver(event: DragEvent): void {
    if (this.boardService.board().use_image_uploading !== 'y') return;
    event.preventDefault();
  }

  onTextareaDrop(event: DragEvent): void {
    if (this.boardService.board().use_image_uploading !== 'y') return;
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
    this.uploadImagesToTextarea(files);
  }

  private uploadImagesToTextarea(files: File[]): void {
    const el = this.messageField?.nativeElement;
    if (!el || files.length === 0) return;
    for (const file of files) {
      const pos = el.selectionStart ?? el.value.length;
      const placeholder = '[img]...[/img]';
      el.value = el.value.substring(0, pos) + placeholder + el.value.substring(pos);
      const start = pos;
      this.imageService.upload(file).subscribe({
        next: (res) => {
          el.value = el.value.substring(0, start) + `[img]${res.url}[/img]` + el.value.substring(start + placeholder.length);
        },
        error: () => {
          el.value = el.value.substring(0, start) + el.value.substring(start + placeholder.length);
        },
      });
    }
  }
}
