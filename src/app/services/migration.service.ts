import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { Migration, ProcessingResult } from '../models/Migration';

@Injectable({ providedIn: 'root' })
export class MigrationService {
  private apiService = inject(ApiService);

  migrations = signal<Migration[]>([]);
  currentMigration = signal<Migration | null>(null);

  load() {
    this.apiService.get<Migration[]>('user-data-migration/list').subscribe({
      next: (data) => this.migrations.set(data),
      error: (err) => console.error('Failed to load migrations', err)
    });
  }

  loadById(id: number) {
    this.apiService.get<Migration>(`user-data-migration/processing/${id}`).subscribe({
      next: (data) => this.currentMigration.set(data),
      error: (err) => console.error('Failed to load migration', err)
    });
  }

  create(payload: { original_topic_id: string; original_post_count: number; forum_domain: string }): Observable<Migration> {
    return this.apiService.post<Migration>('user-data-migration/create-processing', payload);
  }

  process(processing_id: number, json_blob: string): Observable<ProcessingResult> {
    return this.apiService.post<ProcessingResult>('user-data-migration/process-mybb-topic', { processing_id, json_blob });
  }

  updateCharacterMap(processing_id: number, user_map: Record<string, number>): Observable<void> {
    return this.apiService.post<void>('user-data-migration/update-character-map', { processing_id, user_map });
  }

  episodeAutocomplete(term: string): Observable<{ id: number; name: string }[]> {
    const params = new HttpParams().set('is_mine', 'true');
    return this.apiService.get(`episode-autocomplete/${encodeURIComponent(term)}`, params);
  }

  publish(payload: { processing_id: number; topic_id: number; user_map: Record<string, number>; skip_first_post: boolean }): Observable<{ published_posts: number; skipped_posts: number }> {
    return this.apiService.post('user-data-migration/publish', payload);
  }
}
