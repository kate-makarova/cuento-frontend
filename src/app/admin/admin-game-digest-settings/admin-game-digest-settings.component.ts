import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { GameDigestService } from '../../services/game-digest.service';
import { SaveButtonComponent, SaveState } from '../save-button/save-button.component';

@Component({
  selector: 'app-admin-game-digest-settings',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule, SaveButtonComponent, RouterLink],
  templateUrl: './admin-game-digest-settings.component.html',
})
export class AdminGameDigestSettingsComponent implements OnInit {
  private digestService = inject(GameDigestService);

  notifyUserId: number | null = null;
  summaryLanguage = '';
  modelMinSize = 2;
  excludedSubforums = '';

  saveState = signal<SaveState>('idle');

  ngOnInit() {
    this.digestService.getSettings().subscribe({
      next: (settings) => {
        for (const s of settings) {
          switch (s.setting_name) {
            case 'notify_user_id':
              this.notifyUserId = (s.setting_value as number | null) ?? null;
              break;
            case 'summary_language':
              this.summaryLanguage = (s.setting_value as string | null) ?? '';
              break;
            case 'model_requirements': {
              const req = s.setting_value as { min_size?: number } | null;
              this.modelMinSize = req?.min_size ?? 2;
              break;
            }
            case 'excluded_subforums': {
              const arr = (s.setting_value as number[] | null) ?? [];
              this.excludedSubforums = arr.join(', ');
              break;
            }
          }
        }
      },
      error: err => console.error('Failed to load digest settings', err)
    });
  }

  save() {
    this.saveState.set('loading');

    const subforumIds = this.excludedSubforums
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));

    forkJoin([
      this.digestService.saveSetting('notify_user_id', this.notifyUserId || null),
      this.digestService.saveSetting('summary_language', this.summaryLanguage || null),
      this.digestService.saveSetting('model_requirements', { min_size: this.modelMinSize }),
      this.digestService.saveSetting('excluded_subforums', subforumIds),
    ]).subscribe({
      next: () => this.flash('success'),
      error: err => {
        console.error('Failed to save digest settings', err);
        this.flash('error');
      }
    });
  }

  private flash(value: 'success' | 'error') {
    this.saveState.set(value);
    setTimeout(() => this.saveState.set('idle'), 3000);
  }
}
