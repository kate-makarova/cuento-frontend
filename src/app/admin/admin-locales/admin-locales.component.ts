import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { Locale } from '../../models/Locale';

type DownloadState = 'idle' | 'loading' | 'error';

@Component({
  selector: 'app-admin-locales',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [],
  templateUrl: './admin-locales.component.html',
})
export class AdminLocalesComponent implements OnInit {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  locales = signal<Locale[]>([]);
  downloadStates = signal<Record<string, DownloadState>>({});

  ngOnInit() {
    this.apiService.get<Locale[]>('locales').subscribe({
      next: (list) => this.locales.set(list),
      error: (err) => console.error('Failed to load locales', err),
    });
  }

  downloadFrontend(locale: Locale) {
    this.download(`admin/locale/${locale.id}/download/frontend`, locale.front_end_file_name, `frontend_${locale.id}`);
  }

  downloadBackend(locale: Locale) {
    this.download(`admin/locale/${locale.id}/download/backend`, locale.back_end_file_name, `backend_${locale.id}`);
  }

  private download(endpoint: string, filename: string, stateKey: string) {
    this.setDownloadState(stateKey, 'loading');
    const token = this.authService.authToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

    this.http.get(`${environment.apiUrl}/${endpoint}`, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        this.setDownloadState(stateKey, 'idle');
      },
      error: () => this.setDownloadState(stateKey, 'error'),
    });
  }

  private setDownloadState(key: string, state: DownloadState) {
    this.downloadStates.update(s => ({ ...s, [key]: state }));
  }

  getState(key: string): DownloadState {
    return this.downloadStates()[key] ?? 'idle';
  }
}
