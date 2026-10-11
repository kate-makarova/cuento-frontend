import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../services/api.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { DatePipe } from '@angular/common';

type DownloadState = 'idle' | 'loading' | 'error';
type RestoreState = 'idle' | 'loading' | 'success' | 'error';
type SaveState = 'idle' | 'loading' | 'success' | 'error';
type TriggerState = 'idle' | 'loading' | 'success' | 'error';

interface GDriveBackupFile {
  id: string;
  name: string;
  created_time: string;
}

interface GDriveSettings {
  service_account_key: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  keep: number;
  last_run: string | null;
  backups: GDriveBackupFile[];
}

@Component({
  selector: 'app-admin-backup',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './admin-backup.component.html',
})
export class AdminBackupComponent implements OnInit {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  downloadState = signal<DownloadState>('idle');
  restoreState = signal<RestoreState>('idle');
  showConfirmModal = false;
  private pendingFile: File | null = null;

  gdrive = signal<GDriveSettings>({
    service_account_key: '',
    enabled: false,
    frequency: 'daily',
    keep: 5,
    last_run: null,
    backups: [],
  });
  gdriveLoaded = signal(false);
  gdriveSaveState = signal<SaveState>('idle');
  gdriveTriggerState = signal<TriggerState>('idle');

  ngOnInit() {
    this.loadGDriveSettings();
  }

  private loadGDriveSettings() {
    this.apiService.get<GDriveSettings>('admin/backup/gdrive').subscribe({
      next: (s) => {
        this.gdrive.set(s);
        this.gdriveLoaded.set(true);
      },
      error: () => this.gdriveLoaded.set(true),
    });
  }

  updateGdrive<K extends keyof GDriveSettings>(key: K, value: GDriveSettings[K]) {
    this.gdrive.update(s => ({ ...s, [key]: value }));
  }

  saveGDriveSettings() {
    this.gdriveSaveState.set('loading');
    const s = this.gdrive();
    this.apiService.post('admin/backup/gdrive', {
      service_account_key: s.service_account_key,
      enabled: s.enabled,
      frequency: s.frequency,
      keep: s.keep,
    }).subscribe({
      next: () => {
        this.gdriveSaveState.set('success');
        setTimeout(() => this.gdriveSaveState.set('idle'), 3000);
      },
      error: () => {
        this.gdriveSaveState.set('error');
        setTimeout(() => this.gdriveSaveState.set('idle'), 3000);
      },
    });
  }

  triggerGDriveBackup() {
    this.gdriveTriggerState.set('loading');
    this.apiService.post<{ message: string }>('admin/backup/gdrive/trigger', {}).subscribe({
      next: () => {
        this.gdriveTriggerState.set('success');
        setTimeout(() => {
          this.gdriveTriggerState.set('idle');
          this.loadGDriveSettings();
        }, 3000);
      },
      error: () => {
        this.gdriveTriggerState.set('error');
        setTimeout(() => this.gdriveTriggerState.set('idle'), 3000);
      },
    });
  }

  downloadBackup() {
    this.downloadState.set('loading');
    const token = this.authService.authToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

    this.http.get(`${environment.apiUrl}/admin/backup`, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, (c) => c === 'T' ? '_' : '-');
        a.href = url;
        a.download = `backup_${date}.sql`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadState.set('idle');
      },
      error: () => this.downloadState.set('error'),
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    if (!file.name.endsWith('.sql')) {
      alert($localize`:@@admin.backup.invalidFile:Only .sql files are accepted.`);
      return;
    }

    this.pendingFile = file;
    this.showConfirmModal = true;
  }

  cancelRestore() {
    this.pendingFile = null;
    this.showConfirmModal = false;
  }

  confirmRestore() {
    if (!this.pendingFile) return;
    this.showConfirmModal = false;
    this.restoreState.set('loading');

    const token = this.authService.authToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
    const formData = new FormData();
    formData.append('file', this.pendingFile);
    this.pendingFile = null;

    this.http.post(`${environment.apiUrl}/admin/backup/restore`, formData, { headers }).subscribe({
      next: () => {
        this.restoreState.set('success');
        setTimeout(() => this.restoreState.set('idle'), 4000);
      },
      error: () => {
        this.restoreState.set('error');
        setTimeout(() => this.restoreState.set('idle'), 4000);
      },
    });
  }
}
