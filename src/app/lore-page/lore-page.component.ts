import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TopicService } from '../services/topic.service';
import { ForumService } from '../services/forum.service';
import { ApiService } from '../services/api.service';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { RouterLinksDirective } from '../directives/router-links.directive';
import { BreadcrumbItem, BreadcrumbsComponent } from '../components/breadcrumbs/breadcrumbs.component';
import { LorePageInfo } from '../models/LorePage';

@Component({
  selector: 'app-lore-page',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink, SafeHtmlPipe, RouterLinksDirective, BreadcrumbsComponent],
  templateUrl: './lore-page.component.html',
})
export class LorePageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private topicService = inject(TopicService);
  private forumService = inject(ForumService);
  private apiService = inject(ApiService);

  post = this.topicService.singlePost;
  pages = signal<LorePageInfo[]>([]);
  topicId = signal<number>(0);

  private topicName = signal('');
  private topicSubforumId = signal(0);

  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const name = this.topicName();
    if (!name) return [];
    const subforum = this.forumService.subforum();
    const subforumId = this.topicSubforumId();
    return [
      { label: 'Home', link: '/' },
      ...(subforum.id === subforumId && subforumId ? [{ label: subforum.name, link: `/viewforum/${subforum.id}` }] : []),
      { label: name },
    ];
  });

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(paramMap => {
      const topicId = Number(paramMap.get('topicId'));
      const postId = Number(paramMap.get('postId'));

      if (topicId) {
        this.topicId.set(topicId);
        this.apiService.get<LorePageInfo[]>(`lore-topic/${topicId}/pages`).subscribe({
          next: (data) => this.pages.set(data),
          error: (err) => console.error('Failed to load lore pages', err)
        });
        this.topicService.loadTopic(topicId).subscribe({
          next: (topic) => {
            this.topicName.set(topic.name);
            this.topicSubforumId.set(topic.subforum_id);
            this.forumService.loadSubforum(topic.subforum_id);
          },
          error: (err) => console.error('Failed to load lore topic', err)
        });
      }

      if (postId) {
        this.topicService.loadPost(postId).subscribe({
          next: (data) => this.topicService.singlePostSignal.set(data),
          error: (err) => {
            if (err.status === 404) {
              setTimeout(() => this.router.navigate(['/404']));
            } else {
              console.error('Failed to load post', err);
            }
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
