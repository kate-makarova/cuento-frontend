import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MigrationService } from '../services/migration.service';

@Component({
  selector: 'app-create-user-data-migration',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-user-data-migration.component.html',
  styleUrl: './create-user-data-migration.component.css'
})
export class CreateUserDataMigrationComponent {
  private migrationService = inject(MigrationService);
  private router = inject(Router);

  platform = 'mybb';
  forumDomain = '';
  topicId = '';
  postCount: number | null = null;
  loading = false;
  error = '';

  submit() {
    if (!this.forumDomain || !this.topicId || !this.postCount) return;
    this.loading = true;
    this.error = '';
    const domain = this.forumDomain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    this.migrationService.create({
      original_topic_id: this.topicId,
      original_post_count: this.postCount,
      forum_domain: domain
    }).subscribe({
      next: (migration) => {
        this.migrationService.currentMigration.set(migration);
        this.router.navigate(['/migration', migration.id]);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Failed to create migration. Please check your inputs.';
        this.loading = false;
      }
    });
  }
}
