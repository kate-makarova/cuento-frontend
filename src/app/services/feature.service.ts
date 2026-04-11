import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Feature } from '../models/Feature';

@Injectable({ providedIn: 'root' })
export class FeatureService {
  private apiService = inject(ApiService);

  private featuresSignal = signal<Feature[]>([]);
  readonly features = this.featuresSignal.asReadonly();

  loadFeatures(): void {
    this.apiService.get<Feature[]>('features').subscribe({
      next: (data) => this.featuresSignal.set(data),
      error: (err) => console.error('Failed to load features', err)
    });
  }

  toggle(key: string): void {
    this.apiService.post<Feature>(`features/${key}/toggle`, {}).subscribe({
      next: (updated) => this.featuresSignal.update(list =>
        list.map(f => f.key === key ? updated : f)
      ),
      error: (err) => console.error('Failed to toggle feature', err)
    });
  }
}
