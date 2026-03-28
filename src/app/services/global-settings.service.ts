import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Setting } from '../models/Setting';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalSettingsService {
  private apiService = inject(ApiService);

  private settingsSignal = signal<Setting[]>([]);
  readonly settings = this.settingsSignal.asReadonly();

  loadSettings(): void {
    this.apiService.get<Setting[]>('global-settings').subscribe({
      next: (data) => this.settingsSignal.set(data),
      error: (err) => console.error('Failed to load global settings', err)
    });
  }

  updateSettings(settings: Setting[]): Observable<void> {
    return this.apiService.post<void>('global-settings/update', settings);
  }
}
