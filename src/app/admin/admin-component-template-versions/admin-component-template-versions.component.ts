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
}
