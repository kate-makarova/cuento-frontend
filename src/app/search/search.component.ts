import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Category } from '../models/Category';
import { Subforum } from '../models/Subforum';
import { UserListItem } from '../models/User';

const RESULTS_PER_PAGE = 20;

export interface SearchResult {
  id: string;
  snippet: string;
  topic_id?: number;
}

type SearchResults = Record<string, SearchResult[]>;

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './search.component.html',
})
export class SearchComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  buckets = signal<string[]>([]);
  categories = signal<Category[]>([]);
  users = signal<UserListItem[]>([]);

  searchTerm = signal('');
  selectedBuckets = signal<Set<string>>(new Set());
  selectedSubforumId = signal<number | null>(null);
  selectedUserId = signal<number | null>(null);
  currentPage = signal(1);

  results = signal<SearchResults>({});
  totalCount = signal(0);
  loading = signal(false);
  searched = signal(false);

  resultBuckets = computed(() => Object.keys(this.results()));

  subforums = computed<Subforum[]>(() =>
    this.categories().flatMap(c => c.subforums)
  );

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / RESULTS_PER_PAGE)));

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
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

  ngOnInit() {
    this.apiService.get<string[]>('search/buckets').subscribe({
      next: (data) => this.buckets.set(data),
      error: (err) => console.error('Failed to load search buckets', err)
    });

    this.apiService.get<Category[]>('home').subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => console.error('Failed to load categories', err)
    });

    this.apiService.get<UserListItem[]>('user/list').subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('Failed to load users', err)
    });

    const params = this.route.snapshot.queryParamMap;
    const q = params.get('q') ?? '';
    if (q) this.searchTerm.set(q);

    const bucketsParam = params.get('buckets');
    if (bucketsParam) this.selectedBuckets.set(new Set(bucketsParam.split(',')));

    const subforumId = params.get('subforum_id');
    if (subforumId) this.selectedSubforumId.set(+subforumId);

    const userId = params.get('user_id');
    if (userId) this.selectedUserId.set(+userId);

    const page = params.get('page');
    if (page) this.currentPage.set(+page || 1);

    if (q) this.performSearch();
  }

  onSearchTermInput(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onSubforumChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedSubforumId.set(val ? +val : null);
  }

  onUserChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedUserId.set(val ? +val : null);
  }

  toggleBucket(bucket: string) {
    const next = new Set(this.selectedBuckets());
    if (next.has(bucket)) next.delete(bucket);
    else next.add(bucket);
    this.selectedBuckets.set(next);
  }

  isBucketSelected(bucket: string): boolean {
    return this.selectedBuckets().has(bucket);
  }

  search(event?: Event) {
    event?.preventDefault();
    this.currentPage.set(1);
    this.performSearch();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.performSearch();
  }

  getLink(bucket: string, result: SearchResult): string[] {
    if (bucket === 'game_posts' && result.topic_id != null) {
      return ['/viewtopic', result.topic_id.toString()];
    }
    if (bucket === 'characters') {
      return ['/character', result.id];
    }
    return ['/'];
  }

  getFragment(bucket: string, result: SearchResult): string | undefined {
    if (bucket === 'game_posts') return result.id;
    return undefined;
  }

  private buildQueryString(includePage = true): string {
    const parts: string[] = [];
    parts.push(`q=${encodeURIComponent(this.searchTerm().trim())}`);
    const buckets = Array.from(this.selectedBuckets());
    if (buckets.length) parts.push(`buckets=${encodeURIComponent(buckets.join(','))}`);
    const subforumId = this.selectedSubforumId();
    if (subforumId) parts.push(`subforum_id=${subforumId}`);
    const userId = this.selectedUserId();
    if (userId) parts.push(`user_id=${userId}`);
    if (includePage && this.currentPage() > 1) parts.push(`page=${this.currentPage()}`);
    return parts.join('&');
  }

  private performSearch() {
    const q = this.searchTerm().trim();
    if (!q) return;

    this.updateUrl();
    this.loading.set(true);
    this.searched.set(true);

    const qs = this.buildQueryString();
    const countQs = this.buildQueryString(false);

    this.apiService.get<number>(`search/count?${countQs}`).subscribe({
      next: (count) => this.totalCount.set(count),
      error: () => this.totalCount.set(0)
    });

    this.apiService.get<SearchResults>(`search?${qs}`).subscribe({
      next: (data) => {
        this.results.set(data ?? {});
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Search failed', err);
        this.loading.set(false);
      }
    });
  }

  private updateUrl() {
    const queryParams: Record<string, string> = { q: this.searchTerm().trim() };
    const buckets = Array.from(this.selectedBuckets());
    if (buckets.length) queryParams['buckets'] = buckets.join(',');
    const subforumId = this.selectedSubforumId();
    if (subforumId) queryParams['subforum_id'] = subforumId.toString();
    const userId = this.selectedUserId();
    if (userId) queryParams['user_id'] = userId.toString();
    if (this.currentPage() > 1) queryParams['page'] = this.currentPage().toString();

    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }
}
