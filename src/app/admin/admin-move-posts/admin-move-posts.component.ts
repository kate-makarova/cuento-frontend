import { Component, effect, inject, OnInit } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { ApiService } from '../../services/api.service';
import { Category } from '../../models/Category';
import { Subforum } from '../../models/Subforum';
import { Topic } from '../../models/Topic';
import { Post } from '../../models/Post';

const TOPICS_PER_PAGE = 30;
const POSTS_PER_PAGE = 15;

interface PanelState {
  view: 'subforums' | 'topics' | 'posts';
  openSubforum: Subforum | null;
  openTopic: Topic | null;
  topics: Topic[];
  posts: Post[];
  selectedPostIds: Set<number>;
  selectedPosts: Map<number, Post>;
  topicPage: number;
  topicTotalPages: number;
  postPage: number;
  postTotalPages: number;
  loading: boolean;
}

export interface InterleavedItem {
  type: 'existing' | 'incoming';
  post: Post;
}

@Component({
  selector: 'app-admin-move-posts',
  host: { class: 'pun-page' },
  imports: [],
  templateUrl: './admin-move-posts.component.html',
  standalone: true,
  styleUrl: './admin-move-posts.component.css'
})
export class AdminMovePostsComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private apiService = inject(ApiService);

  categories: Category[] = [];
  left: PanelState = this.createPanel();
  right: PanelState = this.createPanel();

  statusMessage = '';
  statusError = false;

  constructor() {
    effect(() => {
      this.categories = this.categoryService.homeCategories();
    });
  }

  ngOnInit() {
    this.categoryService.loadHomeCategories();
  }

  private createPanel(): PanelState {
    return {
      view: 'subforums',
      openSubforum: null,
      openTopic: null,
      topics: [],
      posts: [],
      selectedPostIds: new Set(),
      selectedPosts: new Map(),
      topicPage: 1,
      topicTotalPages: 1,
      postPage: 1,
      postTotalPages: 1,
      loading: false
    };
  }

  private clearSelection(panel: PanelState) {
    panel.selectedPostIds = new Set();
    panel.selectedPosts = new Map();
  }

  openSubforum(panel: PanelState, subforum: Subforum) {
    panel.openSubforum = subforum;
    panel.view = 'topics';
    panel.openTopic = null;
    panel.topics = [];
    panel.posts = [];
    this.clearSelection(panel);
    panel.topicPage = 1;
    panel.topicTotalPages = Math.max(1, Math.ceil((subforum.topic_number || 0) / TOPICS_PER_PAGE));
    this.fetchTopics(panel, 1);
  }

  backToSubforums(panel: PanelState) {
    panel.view = 'subforums';
    panel.openSubforum = null;
    panel.openTopic = null;
    panel.topics = [];
    panel.posts = [];
    this.clearSelection(panel);
    panel.loading = false;
  }

  openTopic(panel: PanelState, topic: Topic) {
    panel.openTopic = topic;
    panel.view = 'posts';
    panel.posts = [];
    this.clearSelection(panel);
    panel.postPage = 1;
    panel.postTotalPages = Math.max(1, Math.ceil((topic.post_number || 0) / POSTS_PER_PAGE));
    this.fetchPosts(panel, 1);
  }

  backToTopics(panel: PanelState) {
    panel.view = 'topics';
    panel.openTopic = null;
    panel.posts = [];
    this.clearSelection(panel);
  }

  fetchTopics(panel: PanelState, page: number) {
    panel.loading = true;
    panel.topicPage = page;
    this.apiService.get<Topic[]>(`viewforum/${panel.openSubforum!.id}/${page}`).subscribe({
      next: (data) => {
        panel.topics = data;
        panel.loading = false;
      },
      error: (err) => {
        console.error('Failed to load topics', err);
        panel.loading = false;
      }
    });
  }

  fetchPosts(panel: PanelState, page: number) {
    panel.loading = true;
    panel.postPage = page;
    this.apiService.get<{ page: number; posts: Post[] }>(`topic-posts/${panel.openTopic!.id}?page=${page}`).subscribe({
      next: (data) => {
        panel.posts = data.posts || [];
        panel.postPage = data.page || page;
        panel.loading = false;
      },
      error: (err) => {
        console.error('Failed to load posts', err);
        panel.loading = false;
      }
    });
  }

  togglePost(panel: PanelState, post: Post) {
    if (panel.selectedPostIds.has(post.id)) {
      panel.selectedPostIds.delete(post.id);
      panel.selectedPosts.delete(post.id);
    } else {
      panel.selectedPostIds.add(post.id);
      panel.selectedPosts.set(post.id, post);
    }
    panel.selectedPostIds = new Set(panel.selectedPostIds);
  }

  canMove(): boolean {
    return this.left.view === 'posts'
      && this.right.view === 'posts'
      && this.left.selectedPostIds.size > 0;
  }

  // Returns right panel's posts interleaved with incoming (selected left) posts,
  // sorted by date_created, so the user can see exactly where posts will land.
  getInterleavedPosts(): InterleavedItem[] {
    const existing = this.right.posts;
    const incoming = this.left.selectedPostIds.size > 0
      ? Array.from(this.left.selectedPosts.values()).sort((a, b) => a.date_created.localeCompare(b.date_created))
      : [];

    if (incoming.length === 0) {
      return existing.map(p => ({ type: 'existing', post: p }));
    }

    const result: InterleavedItem[] = [];
    let inIdx = 0;

    for (const rightPost of existing) {
      while (inIdx < incoming.length && incoming[inIdx].date_created <= rightPost.date_created) {
        result.push({ type: 'incoming', post: incoming[inIdx++] });
      }
      result.push({ type: 'existing', post: rightPost });
    }
    while (inIdx < incoming.length) {
      result.push({ type: 'incoming', post: incoming[inIdx++] });
    }

    return result;
  }

  movePosts() {
    const postIds = Array.from(this.left.selectedPostIds);
    const targetTopicId = this.right.openTopic!.id;

    this.apiService.post('admin/posts/move', { post_ids: postIds, target_topic_id: targetTopicId }).subscribe({
      next: () => {
        this.statusMessage = `${postIds.length} post(s) moved successfully.`;
        this.statusError = false;
        this.clearSelection(this.left);
        this.reloadPanel(this.left);
        this.reloadPanel(this.right);
      },
      error: (err) => {
        this.statusError = true;
        if (err.status === 404) {
          this.statusMessage = 'Target topic not found.';
        } else if (err.status === 400) {
          this.statusMessage = 'Target topic is deleted.';
        } else if (err.status === 422) {
          this.statusMessage = 'Cannot move: target topic would exceed the 1000-post limit.';
        } else {
          this.statusMessage = 'Failed to move posts.';
        }
      }
    });
  }

  private reloadPanel(panel: PanelState) {
    if (!panel.openTopic) return;
    this.apiService.get<Topic>(`topic/get/${panel.openTopic.id}`).subscribe({
      next: (topic) => {
        panel.openTopic = topic;
        panel.postTotalPages = Math.max(1, Math.ceil((topic.post_number || 0) / POSTS_PER_PAGE));
        const page = Math.min(panel.postPage, panel.postTotalPages);
        this.fetchPosts(panel, page);
      },
      error: () => this.fetchPosts(panel, panel.postPage)
    });
  }

  previewContent(content: string): string {
    const stripped = content.replace(/\[.*?\]/g, '').trim();
    return stripped.length > 150 ? stripped.slice(0, 150) + '…' : stripped;
  }

  postIndex(panel: PanelState, i: number): number {
    return (panel.postPage - 1) * POSTS_PER_PAGE + i + 1;
  }
}
