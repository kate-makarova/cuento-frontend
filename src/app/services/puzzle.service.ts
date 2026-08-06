import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Puzzle, PuzzleAchievement } from '../models/Puzzle';

@Injectable({ providedIn: 'root' })
export class PuzzleService {
  private apiService = inject(ApiService);

  list() {
    return this.apiService.get<Puzzle[]>('puzzles');
  }

  get(id: number) {
    return this.apiService.get<Puzzle>(`puzzle/${id}`);
  }

  saveAchievement(puzzleId: number, screenshotUrl: string) {
    return this.apiService.post<PuzzleAchievement>(`puzzle/${puzzleId}/achievement`, { screenshot_url: screenshotUrl });
  }

  deleteAchievement(achievementId: number) {
    return this.apiService.delete<void>(`puzzle/achievement/${achievementId}`);
  }

  getUserAchievements(userId: number) {
    return this.apiService.get<PuzzleAchievement[]>(`user/${userId}/puzzle-achievements`);
  }

  adminList() {
    return this.apiService.get<Puzzle[]>('admin/puzzle/list');
  }

  adminGet(id: number) {
    return this.apiService.get<Puzzle>(`admin/puzzle/${id}`);
  }

  create(data: { title: string; iframe_code: string; is_public: boolean; is_active: boolean }) {
    return this.apiService.post<Puzzle>('admin/puzzle/create', data);
  }

  update(id: number, data: Partial<{ title: string; iframe_code: string; is_public: boolean; is_active: boolean }>) {
    return this.apiService.post<Puzzle>(`admin/puzzle/update/${id}`, data);
  }
}
