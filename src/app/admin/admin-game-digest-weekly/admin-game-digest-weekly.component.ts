import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { GameDigestService } from '../../services/game-digest.service';
import { WeeklyPostNote } from '../../models/GameDigest';
import { SaveButtonComponent, SaveState } from '../save-button/save-button.component';

interface EpisodeGroup {
  episodeId: number;
  episodeName: string;
  topicId: number;
  posts: WeeklyPostNote[];
}

@Component({
  selector: 'app-admin-game-digest-weekly',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule, SaveButtonComponent, RouterLink, DatePipe],
  templateUrl: './admin-game-digest-weekly.component.html',
})
export class AdminGameDigestWeeklyComponent implements OnInit {
  private digestService = inject(GameDigestService);

  weekStart = signal(this.currentMonday());
  pendingOnly = signal(true);

  private allPosts = signal<WeeklyPostNote[]>([]);

  episodeGroups = computed<EpisodeGroup[]>(() => {
    const posts = this.allPosts().filter(p =>
      !this.pendingOnly() || (!p.is_complete && !p.is_deleted)
    );
    const map = new Map<number, EpisodeGroup>();
    for (const p of posts) {
      if (!map.has(p.episode_id)) {
        map.set(p.episode_id, {
          episodeId: p.episode_id,
          episodeName: p.episode_name,
          topicId: p.topic_id,
          posts: [],
        });
      }
      map.get(p.episode_id)!.posts.push(p);
    }
    return Array.from(map.values());
  });

  // Per-post answer text
  answers = signal<Record<number, string>>({});
  // Per-post resolve state
  resolveStates = signal<Record<number, SaveState>>({});

  ngOnInit() {
    this.load();
  }

  load() {
    this.digestService.getWeeklyPosts(this.weekStart()).subscribe({
      next: data => this.allPosts.set(data),
      error: err => console.error('Failed to load weekly posts', err)
    });
  }

  prevWeek() {
    this.weekStart.set(this.offsetWeek(this.weekStart(), -7));
    this.load();
  }

  nextWeek() {
    this.weekStart.set(this.offsetWeek(this.weekStart(), 7));
    this.load();
  }

  setAnswer(postId: number, text: string) {
    this.answers.update(a => ({ ...a, [postId]: text }));
  }

  resolve(post: WeeklyPostNote) {
    const answer = (this.answers()[post.post_id] ?? '').trim();
    if (!answer) return;

    this.resolveStates.update(s => ({ ...s, [post.post_id]: 'loading' }));
    this.digestService.resolvePost(post.post_id, answer).subscribe({
      next: () => {
        // Optimistically mark as complete in the local list.
        this.allPosts.update(list =>
          list.map(p => p.post_id === post.post_id
            ? { ...p, is_complete: true, pending_questions: [] }
            : p
          )
        );
        this.answers.update(a => { const n = { ...a }; delete n[post.post_id]; return n; });
        this.resolveStates.update(s => ({ ...s, [post.post_id]: 'success' }));
        setTimeout(() => this.resolveStates.update(s => {
          const n = { ...s }; delete n[post.post_id]; return n;
        }), 3000);
      },
      error: err => {
        console.error('Failed to resolve post', err);
        this.resolveStates.update(s => ({ ...s, [post.post_id]: 'error' }));
      }
    });
  }

  private currentMonday(): string {
    const d = new Date();
    const offset = (d.getDay() + 6) % 7; // days since Monday
    d.setDate(d.getDate() - offset);
    return d.toISOString().split('T')[0];
  }

  private offsetWeek(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
}
