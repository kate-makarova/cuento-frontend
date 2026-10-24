import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { GameDigest, UpdateGameDigestRequest, GameDigestEpisodeNote, GameDigestSetting, WeeklyPostNote } from '../models/GameDigest';

@Injectable({ providedIn: 'root' })
export class GameDigestService {
  private apiService = inject(ApiService);

  getDigests(implementationId?: number) {
    let params = new HttpParams();
    if (implementationId !== undefined) {
      params = params.set('implementation_id', implementationId);
    }
    return this.apiService.get<GameDigest[]>('game-digest/digests', params);
  }

  getDigest(id: number) {
    return this.apiService.get<GameDigest>(`game-digest/digests/${id}`);
  }

  updateDigest(id: number, req: UpdateGameDigestRequest) {
    return this.apiService.post<{ message: string }>(`game-digest/digests/${id}/update`, req);
  }

  getEpisodeNotes(episodeId: number) {
    return this.apiService.get<GameDigestEpisodeNote>(`game-digest/episode/${episodeId}/notes`);
  }

  saveEpisodeNotes(episodeId: number, notes: unknown) {
    return this.apiService.post<{ message: string }>(`game-digest/episode/${episodeId}/notes`, { notes });
  }

  getSettings() {
    return this.apiService.get<GameDigestSetting[]>('game-digest/settings');
  }

  saveSetting(settingName: string, settingValue: unknown) {
    return this.apiService.post<{ message: string }>('game-digest/settings', {
      setting_name: settingName,
      setting_value: settingValue,
    });
  }

  getWeeklyPosts(weekStart?: string) {
    let params = new HttpParams();
    if (weekStart) {
      params = params.set('week_start', weekStart);
    }
    return this.apiService.get<WeeklyPostNote[]>('game-digest/weekly-posts', params);
  }

  resolvePost(postId: number, answer: string) {
    return this.apiService.post<{ message: string }>(`game-digest/weekly-posts/${postId}/resolve`, { answer });
  }
}
