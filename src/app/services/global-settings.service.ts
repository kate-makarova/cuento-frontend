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
      next: (data) => {
        this.settingsSignal.set(data);
        this.applyDefaults();
      },
      error: (err) => console.error('Failed to load global settings', err)
    });
  }

  private applyDefaults(): void {
    const defaults: Setting[] = [
      { setting_name: 'use_image_uploading', setting_value: 'n' },
    ];
    const missing = defaults.filter(d => !this.settingsSignal().find(s => s.setting_name === d.setting_name));
    if (missing.length) {
      this.settingsSignal.update(list => [...list, ...missing]);
    }
  }

  getSetting(name: string): string | null {
    return this.settingsSignal().find(s => s.setting_name === name)?.setting_value ?? null;
  }

  isEnabled(name: string): boolean {
    return this.getSetting(name) === 'y';
  }

  updateSettings(settings: Setting[]): Observable<void> {
    return this.apiService.post<void>('global-settings/update', settings);
  }
}
