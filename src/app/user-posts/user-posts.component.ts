import { Component, computed, effect, inject, input, numberAttribute, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { BoardService } from '../services/board.service';
import { Post } from '../models/Post';
import { UserProfileResponse } from '../models/User';
import { BreadcrumbItem, BreadcrumbsComponent } from '../components/breadcrumbs/breadcrumbs.component';
import { CharacterProfileComponent } from '../components/character-profile/character-profile.component';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { RouterLinksDirective } from '../directives/router-links.directive';
import { CodeCopyDirective } from '../directives/code-copy.directive';

function coerceToPage(value: unknown): number {
  const num = numberAttribute(value, 1);
  return num < 1 ? 1 : num;
}

interface UserPostsResponse {
  page: number;
  total_posts: number;
  posts: Post[];
}

@Component({
  selector: 'app-user-posts',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [
    RouterLink,
    BreadcrumbsComponent,
    CharacterProfileComponent,
    SafeHtmlPipe,
    RouterLinksDirective,
    CodeCopyDirective,
  ],
  templateUrl: './user-posts.component.html',
})
export class UserPostsComponent {
  private apiService = inject(ApiService);
  private boardService = inject(BoardService);
  private titleService = inject(Title);

  id = input<number | undefined, unknown>(undefined, { transform: numberAttribute });
  pageNumber = input<number, unknown>(1, { transform: coerceToPage, alias: 'page' });

  username = signal<string>('');
  posts = signal<Post[]>([]);
  totalPosts = signal<number>(0);
  breadcrumbs = signal<BreadcrumbItem[]>([{ label: 'Home', link: '/' }]);

  postsPerPage = computed(() => this.boardService.board().posts_per_page || 15);
  totalPages = computed(() => Math.ceil(this.totalPosts() / this.postsPerPage()) || 0);

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.pageNumber();
    if (total <= 1) return [];

    const pageSet = new Set<number>();
    pageSet.add(1);
    pageSet.add(total);
    for (let p = current - 1; p <= current + 1; p++) {
      if (p >= 1 && p <= total) pageSet.add(p);
    }

    const sorted = Array.from(pageSet).sort((a, b) => a - b);
    const result: Array<{ type: 'page' | 'ellipsis'; number?: number }> = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
        result.push({ type: 'ellipsis' });
      }
      result.push({ type: 'page', number: sorted[i] });
    }
    return result;
  });

  constructor() {
    effect(() => {
      const userId = this.id();
      if (!userId) return;

      this.apiService.get<UserProfileResponse>(`user/profile/${userId}`).subscribe({
        next: (profile) => {
          this.username.set(profile.username);
          const label = $localize`:@@userPosts.title:Posts by ${profile.username}`;
          this.titleService.setTitle(label);
          this.breadcrumbs.set([
            { label: 'Home', link: '/' },
            { label: profile.username, link: `/profile/${userId}` },
            { label: $localize`:@@userPosts.posts:Posts` },
          ]);
        },
        error: () => {}
      });
    });

    effect(() => {
      const userId = this.id();
      const page = this.pageNumber();
      if (!userId) return;

      this.apiService.get<UserPostsResponse>(`user-posts/${userId}?page=${page}`).subscribe({
        next: (data) => {
          this.posts.set(data.posts ?? []);
          this.totalPosts.set(data.total_posts ?? 0);
        },
        error: () => {
          this.posts.set([]);
          this.totalPosts.set(0);
        }
      });
    });
  }
}
