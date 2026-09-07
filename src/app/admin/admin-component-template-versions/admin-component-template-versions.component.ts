import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { BreadcrumbsComponent } from '../../components/breadcrumbs/breadcrumbs.component';

export interface ComponentTemplateVersion {
  id: number;
  name: string;
  template_file_name: string;
  is_active: boolean;
}

type ActionState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-admin-component-template-versions',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink, BreadcrumbsComponent],
  templateUrl: './admin-component-template-versions.component.html',
  styleUrl: './admin-component-template-versions.component.css',
})
export class AdminComponentTemplateVersionsComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);

  componentName = signal('');
  versions = signal<ComponentTemplateVersion[]>([]);
  loading = signal(true);
  error = signal(false);

  publishingVersion = signal<ComponentTemplateVersion | null>(null);
  publishState = signal<ActionState>('idle');

  showUnpublishModal = signal(false);
  unpublishState = signal<ActionState>('idle');

  get hasActiveVersion(): boolean {
    return this.versions().some(v => v.is_active);
  }

  ngOnInit() {
    const name = this.route.snapshot.queryParamMap.get('name') ?? '';
    this.componentName.set(name);

    this.apiService.get<ComponentTemplateVersion[]>(`admin/frontend-templates/components-versions/${name}`).subscribe({
      next: (data) => {
        this.versions.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load component versions', err);
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  // ── Publish ──────────────────────────────────────────────────────────────────

  confirmPublish(version: ComponentTemplateVersion) {
    this.publishingVersion.set(version);
    this.publishState.set('idle');
  }

  cancelPublish() {
    this.publishingVersion.set(null);
    this.publishState.set('idle');
  }

  publish() {
    const version = this.publishingVersion();
    if (!version) return;

    this.publishState.set('loading');
    this.apiService.post(`admin/frontend-templates/component/${version.id}/publish`, {}).subscribe({
      next: () => {
        this.publishState.set('success');
        this.versions.update(list =>
          list.map(v => ({ ...v, is_active: v.id === version.id }))
        );
        setTimeout(() => {
          this.publishingVersion.set(null);
          this.publishState.set('idle');
        }, 1500);
      },
      error: (err) => {
        console.error('Failed to publish version', err);
        this.publishState.set('error');
        setTimeout(() => this.publishState.set('idle'), 3000);
      },
    });
  }

  // ── Unpublish ────────────────────────────────────────────────────────────────

  confirmUnpublish() {
    this.showUnpublishModal.set(true);
    this.unpublishState.set('idle');
  }

  cancelUnpublish() {
    this.showUnpublishModal.set(false);
    this.unpublishState.set('idle');
  }

  unpublish() {
    this.unpublishState.set('loading');
    this.apiService.post(`admin/frontend-templates/component/unpublish/${this.componentName()}`, {}).subscribe({
      next: () => {
        this.unpublishState.set('success');
        this.versions.update(list => list.map(v => ({ ...v, is_active: false })));
        setTimeout(() => {
          this.showUnpublishModal.set(false);
          this.unpublishState.set('idle');
        }, 1500);
      },
      error: (err) => {
        console.error('Failed to unpublish component', err);
        this.unpublishState.set('error');
        setTimeout(() => this.unpublishState.set('idle'), 3000);
      },
    });
  }
}
