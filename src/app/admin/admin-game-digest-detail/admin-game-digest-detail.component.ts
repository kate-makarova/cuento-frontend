import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { GameDigestService } from '../../services/game-digest.service';
import { GameDigest } from '../../models/GameDigest';
import { SaveButtonComponent, SaveState } from '../save-button/save-button.component';

@Component({
  selector: 'app-admin-game-digest-detail',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule, SaveButtonComponent, RouterLink, DatePipe],
  templateUrl: './admin-game-digest-detail.component.html',
})
export class AdminGameDigestDetailComponent implements OnInit {
  private digestService = inject(GameDigestService);
  private route = inject(ActivatedRoute);

  digest = signal<GameDigest | null>(null);
  isPublished = false;
  publishedPostId: number | null = null;

  saveState = signal<SaveState>('idle');

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.digestService.getDigest(id).subscribe({
      next: (data) => {
        this.digest.set(data);
        this.isPublished = data.is_published;
        this.publishedPostId = data.published_post_id;
      },
      error: err => console.error('Failed to load digest', err)
    });
  }

  save() {
    const d = this.digest();
    if (!d) return;
    this.saveState.set('loading');
    this.digestService.updateDigest(d.id, {
      is_published: this.isPublished,
      published_post_id: this.publishedPostId || null,
    }).subscribe({
      next: () => {
        this.digest.update(d => d ? { ...d, is_published: this.isPublished, published_post_id: this.publishedPostId } : d);
        this.flash('success');
      },
      error: err => {
        console.error('Failed to save digest', err);
        this.flash('error');
      }
    });
  }

  private flash(value: 'success' | 'error') {
    this.saveState.set(value);
    setTimeout(() => this.saveState.set('idle'), 3000);
  }
}
