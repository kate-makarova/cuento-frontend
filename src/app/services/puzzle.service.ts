import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Puzzle, PuzzleAchievement } from '../models/Puzzle';

@Injectable({ providedIn: 'root' })
export class PuzzleService {
  private apiService = inject(ApiService);

  list() {
    return this.apiService.get<Puzzle[]>('puzzle/list');
  }

  get(id: number) {
    return this.apiService.get<Puzzle>(`puzzle/${id}`);
  }

  create(data: { title: string; iframe_code: string; is_public: boolean }) {
    return this.apiService.post<Puzzle>('puzzle/create', data);
  }

  update(id: number, data: Partial<{ title: string; iframe_code: string; is_public: boolean; is_active: boolean }>) {
    return this.apiService.post<Puzzle>(`puzzle/update/${id}`, data);
  }

  delete(id: number) {
    return this.apiService.post<void>(`puzzle/delete/${id}`, {});
  }

  getAchievements(puzzleId: number) {
    return this.apiService.get<PuzzleAchievement[]>(`puzzle/${puzzleId}/achievements`);
  }

  saveAchievement(puzzleId: number, screenshotUrl: string) {
    return this.apiService.post<PuzzleAchievement>(`puzzle/${puzzleId}/achievement`, { screenshot_url: screenshotUrl });
  }
}
