import { Component, inject, OnInit, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SaveButtonComponent } from '../save-button/save-button.component';

export interface FrontendComponent {
  name: string;
  template_path: string;
  default_template_path: string;
  description: string;
  active: boolean;
}

type SaveState = 'idle' | 'loading' | 'success' | 'error';

const DESCRIPTIONS: Record<string, string> = {
  'src/app/components/category': $localize`:@@frontend_component.src_app_components_category.description:Category page listing topics with filtering and navigation`,
  'src/app/components/footer_statistics': $localize`:@@frontend_component.src_app_components_footer_statistics.description:Footer statistics bar showing site-wide post and user counts`,
  'src/app/components/episode_header': $localize`:@@frontend_component.src_app_components_episode_header.description:Episode header displaying title, participants and episode metadata`,
  'src/app/components/character_sheet_header': $localize`:@@frontend_component.src_app_components_character_sheet_header.description:Character sheet header with avatar, name and key character details`,
  'src/app/components/wanted_character_header': $localize`:@@frontend_component.src_app_components_wanted_character_header.description:Wanted character ad header with role description and requirements`,
};

@Component({
  selector: 'app-admin-frontend-templates',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink, SaveButtonComponent],
  templateUrl: './admin-frontend-templates.component.html',
  styleUrl: './admin-frontend-templates.component.css',
})
export class AdminFrontendTemplatesComponent implements OnInit {
  private apiService = inject(ApiService);

  components = signal<FrontendComponent[]>([]);
  saveState = signal<SaveState>('idle');

  ngOnInit() {
    this.apiService.get<FrontendComponent[]>('admin/frontend-templates/components').subscribe({
      next: (data) => this.components.set(data),
      error: (err) => console.error('Failed to load frontend components', err),
    });
  }

  getDescription(name: string, fallback: string): string {
    return DESCRIPTIONS[name] ?? fallback;
  }

  toggle(comp: FrontendComponent) {
    this.components.update((list) =>
      list.map((c) => (c.name === comp.name ? { ...c, active: !c.active } : c))
    );
  }

  save() {
    this.saveState.set('loading');
    const activeComponents = this.components()
      .filter((c) => c.active)
      .map((c) => c.name);

    this.apiService
      .post('admin/frontend-templates/env/update', { active_components: activeComponents })
      .subscribe({
        next: () => this.flash('success'),
        error: (err) => {
          console.error('Failed to update frontend templates', err);
          this.flash('error');
        },
      });
  }

  private flash(state: 'success' | 'error') {
    this.saveState.set(state);
    setTimeout(() => this.saveState.set('idle'), 3000);
  }
}
