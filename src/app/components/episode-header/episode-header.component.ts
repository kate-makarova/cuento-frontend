import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { switchMap, tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { Episode } from '../../models/Episode';
import { FieldDisplayComponent } from '../field-display/field-display.component';
import { CustomFieldsData, CustomFieldValue } from '../../models/Character';
import { RouterLink } from '@angular/router';
import { EpisodeService } from '../../services/episode.service';
import { ImageService } from '../../services/image.service';
import { CharacterService } from '../../services/character.service';
import { BoardService } from '../../services/board.service';
import { CroppedImageFieldComponent } from '../cropped-image-field/cropped-image-field.component';

export interface EpisodeCustomAvatarState {
  character_id: number;
  character_name: string;
  custom_avatar: string | null;
  removing: boolean;
  removeError: boolean;
  urlInput: string;
}

@Component({
  selector: 'app-episode-header',
  imports: [RouterLink, FieldDisplayComponent, CroppedImageFieldComponent],
  templateUrl: './episode-header.component.html',
  standalone: true,
})
export class EpisodeHeaderComponent implements OnInit, OnChanges {
  @Input() episode!: Episode | null;
  @Input() canEdit: boolean = false;
  @Output() statusChanged = new EventEmitter<{ episode_status: number; topic_status: number }>();

  private episodeService = inject(EpisodeService);
  private imageService = inject(ImageService);
  private characterService = inject(CharacterService);
  private boardService = inject(BoardService);

  customFields: any[] = [];
  userCharacterProfiles = this.characterService.userCharacterProfiles;

  showActionsModal = signal(false);
  stateChangePending = signal(false);
  stateChangeError = signal<string | null>(null);
  pendingStatus = signal<number>(0);

  customAvatars = signal<EpisodeCustomAvatarState[]>([]);
  avatarsLoading = signal(false);

  private uploadFns = new Map<number, (file: File) => Observable<{ url: string }>>();

  readonly canUploadImages = computed(() => this.boardService.board().use_image_uploading === 'y');
  readonly avatarWidth = computed(() => this.boardService.board().user_avatar_width);
  readonly avatarHeight = computed(() => this.boardService.board().user_avatar_height);

  get showActionsButton(): boolean {
    return this.canEdit || this.userCharacterProfiles().length > 0;
  }

  get canChangeStatus(): boolean {
    return this.canEdit || this.userCharacterProfiles().length > 0;
  }

  ngOnInit() {
    this.updateCustomFields();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['episode']) {
      this.updateCustomFields();
    }
  }

  getField(machineName: string): any | undefined {
    return this.customFields.find(f => f.fieldMachineName === machineName);
  }

  get ratingBadge(): string | null {
    if (!this.episode?.rating_set) return null;
    return `L${this.episode.rating_language}V${this.episode.rating_violence}S${this.episode.rating_sex}`;
  }

  openActionsModal() {
    this.pendingStatus.set(this.episode?.episode_status ?? 0);
    this.stateChangeError.set(null);
    this.showActionsModal.set(true);

    if (this.userCharacterProfiles().length > 0 && this.episode) {
      this.loadCustomAvatars();
    }
  }

  closeActionsModal() {
    this.showActionsModal.set(false);
  }

  private loadCustomAvatars() {
    const episodeId = this.episode?.id;
    if (!episodeId) return;
    this.avatarsLoading.set(true);
    this.uploadFns.clear();

    this.episodeService.getMyCustomAvatars(episodeId).subscribe({
      next: (items) => {
        this.customAvatars.set(items.map(item => ({
          character_id: item.character_id,
          character_name: item.character_name,
          custom_avatar: item.custom_avatar,
          removing: false,
          removeError: false,
          urlInput: '',
        })));

        items.forEach(item => {
          this.uploadFns.set(item.character_id, (file: File) =>
            this.imageService.upload(file).pipe(
              switchMap(result =>
                this.episodeService.setCustomAvatar(episodeId, item.character_id, result.url).pipe(
                  tap((res) => this.customAvatars.update(list =>
                    list.map(a => a.character_id === item.character_id
                      ? { ...a, custom_avatar: res.custom_avatar }
                      : a)
                  )),
                  map((res) => ({ url: res.custom_avatar }))
                )
              )
            )
          );
        });

        this.avatarsLoading.set(false);
      },
      error: () => this.avatarsLoading.set(false),
    });
  }

  getUploadFn(characterId: number): (file: File) => Observable<{ url: string }> {
    return this.uploadFns.get(characterId)!;
  }

  applyCustomAvatarFromUrl(characterId: number) {
    const entry = this.customAvatars().find(a => a.character_id === characterId);
    const url = entry?.urlInput?.trim();
    if (!url || !this.episode) return;

    this.episodeService.setCustomAvatar(this.episode.id, characterId, url).subscribe({
      next: (res) => {
        this.customAvatars.update(list =>
          list.map(a => a.character_id === characterId
            ? { ...a, custom_avatar: res.custom_avatar, urlInput: '' }
            : a)
        );
      },
      error: () => {},
    });
  }

  removeCustomAvatar(characterId: number) {
    if (!this.episode) return;
    this.customAvatars.update(list =>
      list.map(a => a.character_id === characterId ? { ...a, removing: true, removeError: false } : a)
    );
    this.episodeService.removeCustomAvatar(this.episode.id, characterId).subscribe({
      next: () => {
        this.customAvatars.update(list =>
          list.map(a => a.character_id === characterId
            ? { ...a, custom_avatar: null, removing: false }
            : a)
        );
      },
      error: () => {
        this.customAvatars.update(list =>
          list.map(a => a.character_id === characterId ? { ...a, removing: false, removeError: true } : a)
        );
      },
    });
  }

  setUrlInput(characterId: number, value: string) {
    this.customAvatars.update(list =>
      list.map(a => a.character_id === characterId ? { ...a, urlInput: value } : a)
    );
  }

  changeEpisodeStatus() {
    if (!this.episode || this.stateChangePending()) return;
    const status = this.pendingStatus();
    if (status === this.episode.episode_status) return;
    this.stateChangePending.set(true);
    this.stateChangeError.set(null);
    this.episodeService.setEpisodeStatus(this.episode.id, status).subscribe({
      next: (result) => {
        this.stateChangePending.set(false);
        this.statusChanged.emit(result);
      },
      error: () => {
        this.stateChangePending.set(false);
        this.stateChangeError.set('error');
      }
    });
  }

  private updateCustomFields() {
    if (this.episode && this.episode.custom_fields) {
      this.customFields = this.processCustomFields(this.episode.custom_fields);
    } else {
      this.customFields = [];
    }
  }

  private processCustomFields(data: CustomFieldsData): any[] {
    if (!data || !data.field_config) return [];

    return data.field_config.map(config => {
      const customField: CustomFieldValue | undefined = data.custom_fields ? data.custom_fields[config.machine_field_name] : undefined;
      let fieldValue: any = '';

      if (customField) {
        let content = customField.content;
        if (config.content_field_type === 'dropdown' || config.content_field_type === 'radiobox') {
          fieldValue = content?.value ?? '';
        } else {
          if (content !== null && content !== undefined && typeof content === 'object') {
            content = 'content' in content ? (content as any).content : '';
          }
          if (config.content_field_type === 'long_text') {
            fieldValue = customField.content_html || (content != null ? String(content) : '');
          } else {
            fieldValue = content;
          }
        }
      }

      return {
        fieldMachineName: config.machine_field_name,
        fieldName: config.human_field_name,
        fieldValue: fieldValue ?? '',
        type: config.content_field_type,
        showFieldName: true,
        order: config.order
      };
    }).sort((a, b) => a.order - b.order);
  }
}
