import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

type DownloadState = 'idle' | 'loading' | 'error';
type RestoreState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-admin-backup',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-backup.component.html',
})
export class AdminBackupComponent {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  downloadState = signal<DownloadState>('idle');
  restoreState = signal<RestoreState>('idle');
  showConfirmModal = false;
  private pendingFile: File | null = null;

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
