import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { Episode } from '../../models/Episode';
import { EpisodeCustomAvatarState } from '../episode-header/episode-header.component';
import { CroppedImageFieldComponent } from '../cropped-image-field/cropped-image-field.component';

@Component({
  selector: 'app-episode-actions-modal',
  standalone: true,
  imports: [CroppedImageFieldComponent],
  templateUrl: './episode-actions-modal.component.html',
})
export class EpisodeActionsModalComponent {
  @Input() episode!: Episode | null;
  @Input() canChangeStatus: boolean = false;
  @Input() hasCharacters: boolean = false;
  @Input() stateChangePending: boolean = false;
  @Input() stateChangeError: string | null = null;
  @Input() pendingStatus: number = 0;
  @Input() customAvatars: EpisodeCustomAvatarState[] = [];
  @Input() avatarsLoading: boolean = false;
  @Input() canUploadImages: boolean = false;
  @Input() avatarWidth: number | undefined;
  @Input() avatarHeight: number | undefined;
  @Input() getUploadFn!: (characterId: number) => Observable<{ url: string }>;

  @Output() close = new EventEmitter<void>();
  @Output() pendingStatusChange = new EventEmitter<number>();
  @Output() saveStatus = new EventEmitter<void>();
  @Output() removeAvatar = new EventEmitter<number>();
  @Output() urlInputChange = new EventEmitter<{ characterId: number; value: string }>();
  @Output() applyFromUrl = new EventEmitter<number>();
}
