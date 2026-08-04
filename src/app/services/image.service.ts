import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private apiService = inject(ApiService);

  upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.post<{ url: string; thumbnail_url: string }>('image/upload', formData);
  }

  uploadUserAvatar(file: File) {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.apiService.post<{ avatar: string }>('user/avatar', fd).pipe(
      map(res => ({ url: res.avatar }))
    );
  }

  uploadCharacterAvatar(characterId: number, file: File) {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.apiService.post<{ avatar: string }>(`character/${characterId}/avatar`, fd).pipe(
      map(res => ({ url: res.avatar }))
    );
  }

  uploadCharacterProfileAvatar(characterId: number, file: File) {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.apiService.post<{ avatar: string }>(`character-profile/${characterId}/avatar`, fd).pipe(
      map(res => ({ url: res.avatar }))
    );
  }
}
