import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ArcCreateRequest, ArcEpisode, ArcFilterRequest, ArcListResponse, ArcUpdateRequest, StoryArc } from '../models/StoryArc';

@Injectable({ providedIn: 'root' })
export class ArcService {
  private apiService = inject(ApiService);

  readonly arcs = signal<StoryArc[]>([]);
  readonly totalPages = signal(1);

  loadArcs(filter: ArcFilterRequest = {}): void {
    this.apiService.post<ArcListResponse | StoryArc[]>('arc/list', filter).subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.arcs.set(res);
          this.totalPages.set(1);
        } else {
          this.arcs.set(res.items);
          this.totalPages.set(res.total_pages ?? 1);
        }
      },
      error: (err) => console.error('Failed to load arcs', err)
    });
  }

  getArc(id: number): Observable<StoryArc> {
    return this.apiService.get<StoryArc>(`arc/${id}`);
  }

  createArc(data: ArcCreateRequest): Observable<StoryArc> {
    return this.apiService.post<StoryArc>('arc/create', data);
  }

  updateArc(id: number, data: Omit<ArcUpdateRequest, 'id'>): Observable<StoryArc> {
    return this.apiService.post<StoryArc>(`arc/update/${id}`, data);
  }

  getArcEpisodes(id: number): Observable<ArcEpisode[]> {
    return this.apiService.get<ArcEpisode[]>(`arc/${id}/episodes`);
  }
}
