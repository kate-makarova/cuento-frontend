import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { Locale } from '../../models/Locale';

type DownloadState = 'idle' | 'loading' | 'error';
type ActionState = 'idle' | 'loading' | 'error' | 'success';
type LocaleAction = 'install' | 'uninstall' | 'delete' | 'reinstall';

const PROTECTED_LOCALES = ['en-CA'];

@Component({
  selector: 'app-admin-locales',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-locales.component.html',
})
export class AdminLocalesComponent implements OnInit {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  locales = signal<Locale[]>([]);
  downloadStates = signal<Record<string, DownloadState>>({});

  pendingLocale = signal<{ locale: Locale; action: LocaleAction } | null>(null);
  actionState = signal<ActionState>('idle');

  uploadName = signal('');
  uploadCode = signal('');
  uploadFrontendFile = signal<File | null>(null);
  uploadBackendFile = signal<File | null>(null);
  uploadState = signal<ActionState>('idle');

  reuploadTarget = signal<Locale | null>(null);
  reuploadFrontendFile = signal<File | null>(null);
  reuploadBackendFile = signal<File | null>(null);
  reuploadState = signal<ActionState>('idle');

  ngOnInit() {
    this.apiService.get<Locale[]>('locales').subscribe({
      next: (list) => this.locales.set(list.map(l => ({ ...l, is_installed: !!l.is_installed }))),
      error: (err) => console.error('Failed to load locales', err),
    });
  }

  onFrontendFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.uploadFrontendFile.set(input.files?.[0] ?? null);
  }

  onBackendFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.uploadBackendFile.set(input.files?.[0] ?? null);
  }

  upload() {
    const frontend = this.uploadFrontendFile();
    const backend = this.uploadBackendFile();
    if (!this.uploadName() || !this.uploadCode() || !frontend || !backend) return;

    const formData = new FormData();
    formData.append('human_name', this.uploadName());
    formData.append('code', this.uploadCode());
    formData.append('frontend_file', frontend);
    formData.append('backend_file', backend);

    const name = this.uploadName();
    const code = this.uploadCode();

    this.uploadState.set('loading');
    this.apiService.postForm<Partial<Locale>>('admin/locale/upload', formData).subscribe({
      next: (partial) => {
        const locale: Locale = {
          id: 0,
          human_name: name,
          code,
          is_installed: false,
          front_end_file_name: frontend.name,
          back_end_file_name: backend.name,
          ...partial,
        } as Locale;
        this.locales.update(list => [...list, locale]);
        this.uploadName.set('');
        this.uploadCode.set('');
        this.uploadFrontendFile.set(null);
        this.uploadBackendFile.set(null);
        this.uploadState.set('success');
      },
      error: () => this.uploadState.set('error'),
    });
  }

  confirmInstall(locale: Locale) {
    this.pendingLocale.set({ locale, action: 'install' });
    this.actionState.set('idle');
  }

  confirmUninstall(locale: Locale) {
    this.pendingLocale.set({ locale, action: 'uninstall' });
    this.actionState.set('idle');
  }

  confirmDelete(locale: Locale) {
    this.pendingLocale.set({ locale, action: 'delete' });
    this.actionState.set('idle');
  }

  confirmReinstall(locale: Locale) {
    this.pendingLocale.set({ locale, action: 'reinstall' });
    this.actionState.set('idle');
  }

  needsReinstall(locale: Locale): boolean {
    return !!(locale.is_installed
      && locale.file_size_fe != null
      && locale.installed_file_size_fe != null
      && locale.file_size_fe !== locale.installed_file_size_fe);
  }

  cancelAction() {
    this.pendingLocale.set(null);
    this.actionState.set('idle');
  }

  confirmAction() {
    const pending = this.pendingLocale();
    if (!pending) return;

    this.actionState.set('loading');
    const apiAction = pending.action === 'reinstall' ? 'install' : pending.action;
    const endpoint = `admin/locale/${pending.locale.id}/${apiAction}`;

    this.apiService.post<void>(endpoint, {}).subscribe({
      next: () => {
        if (pending.action === 'delete') {
          this.locales.update(list => list.filter(l => l.id !== pending.locale.id));
        } else if (pending.action === 'reinstall') {
          this.locales.update(list =>
            list.map(l => l.id === pending.locale.id
              ? { ...l, installed_file_size_fe: l.file_size_fe }
              : l)
          );
        } else {
          const installed = pending.action === 'install';
          this.locales.update(list =>
            list.map(l => l.id === pending.locale.id ? { ...l, is_installed: installed } : l)
          );
        }
        this.actionState.set('success');
        setTimeout(() => {
          this.pendingLocale.set(null);
          this.actionState.set('idle');
        }, 1500);
      },
      error: () => {
        this.actionState.set('error');
        setTimeout(() => this.actionState.set('idle'), 3000);
      },
    });
  }

  isProtected(locale: Locale): boolean {
    return PROTECTED_LOCALES.includes(locale.code);
  }

  canReupload(locale: Locale): boolean {
    const builtIn = ['en.ts', 'ru.ts', 'en.json', 'ru.json'];
    return !builtIn.includes(locale.front_end_file_name) && !builtIn.includes(locale.back_end_file_name);
  }

  openReupload(locale: Locale) {
    this.reuploadTarget.set(locale);
    this.reuploadFrontendFile.set(null);
    this.reuploadBackendFile.set(null);
    this.reuploadState.set('idle');
  }

  cancelReupload() {
    this.reuploadTarget.set(null);
    this.reuploadState.set('idle');
  }

  onReuploadFrontendFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.reuploadFrontendFile.set(input.files?.[0] ?? null);
  }

  onReuploadBackendFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.reuploadBackendFile.set(input.files?.[0] ?? null);
  }

  reupload() {
    const target = this.reuploadTarget();
    const frontend = this.reuploadFrontendFile();
    const backend = this.reuploadBackendFile();
    if (!target || (!frontend && !backend)) return;

    const formData = new FormData();
    if (frontend) formData.append('frontend_file', frontend);
    if (backend) formData.append('backend_file', backend);

    this.reuploadState.set('loading');
    this.apiService.postForm<{ file_size_fe?: number; file_size_be?: number }>(
      `admin/locale/${target.id}/reupload`, formData
    ).subscribe({
      next: (result) => {
        this.locales.update(list =>
          list.map(l => l.id === target.id ? { ...l, ...result } : l)
        );
        this.reuploadState.set('success');
        setTimeout(() => {
          this.reuploadTarget.set(null);
          this.reuploadState.set('idle');
        }, 1500);
      },
      error: () => {
        this.reuploadState.set('error');
        setTimeout(() => this.reuploadState.set('idle'), 3000);
      },
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

  getDownloadState(key: string): DownloadState {
    return this.downloadStates()[key] ?? 'idle';
  }
}
