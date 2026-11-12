import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SaveButtonComponent } from '../save-button/save-button.component';

type SaveState = 'idle' | 'loading' | 'success' | 'error';

interface ImageHostingSettings {
  enabled: string;
  storage: string;
  ram_limit_mb: string;
  s3_endpoint: string;
  s3_bucket: string;
  s3_access_key: string;
  s3_secret_key: string;
  nginx_active: boolean;
  upload_provider: string;
  base_url: string;
  imgbb_api_key: string;
}

@Component({
  selector: 'app-admin-image-hosting',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule, SaveButtonComponent],
  templateUrl: './admin-image-hosting.component.html',
  styleUrl: './admin-image-hosting.component.css',
})
export class AdminImageHostingComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  isSuperuser = this.authService.isSuperuser;

  settings = signal<ImageHostingSettings>({
    enabled: 'n',
    storage: 'local',
    ram_limit_mb: '5',
    s3_endpoint: '',
    s3_bucket: '',
    s3_access_key: '',
    s3_secret_key: '',
    nginx_active: false,
    upload_provider: 'imgbb',
    base_url: '',
    imgbb_api_key: '',
  });

  loaded = signal(false);
  saveState = signal<SaveState>('idle');
  saveMessage = signal('');

  ngOnInit() {
    this.apiService.get<ImageHostingSettings>('admin/image-hosting').subscribe({
      next: (s) => {
        this.settings.set(s);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  update<K extends keyof ImageHostingSettings>(key: K, value: ImageHostingSettings[K]) {
    this.settings.update(s => ({ ...s, [key]: value }));
  }

  save() {
    this.saveState.set('loading');
    this.apiService.post<{ message: string }>('admin/image-hosting', this.settings()).subscribe({
      next: (res) => {
        this.saveMessage.set(res.message);
        this.saveState.set('success');
        // Reload to get the updated nginx_active status
        this.apiService.get<ImageHostingSettings>('admin/image-hosting').subscribe({
          next: (s) => this.settings.set(s),
        });
        setTimeout(() => {
          this.saveState.set('idle');
          this.saveMessage.set('');
        }, 3000);
      },
      error: () => {
        this.saveState.set('error');
        setTimeout(() => this.saveState.set('idle'), 3000);
      },
    });
  }
}
