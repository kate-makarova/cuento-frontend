import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { ArcFilterRequest, ArcListResponse, StoryArc } from '../models/StoryArc';

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
}
