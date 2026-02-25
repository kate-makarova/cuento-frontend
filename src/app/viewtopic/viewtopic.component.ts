import {Component, effect, inject, Input, OnInit, OnDestroy, ViewChild, signal, computed, numberAttribute} from '@angular/core';
import {PostFormComponent} from '../components/post-form/post-form.component';
import {TopicService} from '../services/topic.service';
import {Router, RouterLink, ActivatedRoute} from '@angular/router';
import {CommonModule} from '@angular/common';
import {CharacterProfileComponent} from '../components/character-profile/character-profile.component';
import {TopicType} from '../models/Topic';
import {EpisodeHeaderComponent} from '../components/episode-header/episode-header.component';
import {Post} from '../models/Post';
import {BreadcrumbItem, BreadcrumbsComponent} from '../components/breadcrumbs/breadcrumbs.component';
import {ForumService} from '../services/forum.service';
import {TopicReadByComponent} from '../components/topic-read-by/topic-read-by.component';
import { CharacterSheetHeaderComponent } from '../components/character-sheet-header/character-sheet-header.component';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe'
import { CharacterService } from '../services/character.service';
import { AuthService } from '../services/auth.service';
import { Subject, takeUntil, combineLatest } from 'rxjs';

function coerceToPage(value: unknown): number {
  const num = numberAttribute(value, 1);
  return num < 1 ? 1 : num;
}

@Component({
  selector: 'app-viewtopic',
  imports: [
    PostFormComponent,
    RouterLink,
    CommonModule,
    CharacterProfileComponent,
    EpisodeHeaderComponent,
    BreadcrumbsComponent,
    TopicReadByComponent,
    CharacterSheetHeaderComponent,
    SafeHtmlPipe
  ],
  templateUrl: './viewtopic.component.html',
  standalone: true,
  styleUrl: './viewtopic.component.css'
})
export class ViewtopicComponent implements OnInit, OnDestroy {
  topicService = inject(TopicService);
  forumService = inject(ForumService);
  characterService = inject(CharacterService);
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  @Input({ transform: numberAttribute }) id?: number;
  @Input({ transform: coerceToPage, alias: 'page' }) pageNumber: number = 1;

  topic = this.topicService.topic;
  posts = this.topicService.posts;
  subforum = this.forumService.subforum;
  userCharacterProfiles = this.characterService.userCharacterProfiles;

  accountName = this.authService.currentUser()?.username || 'Guest';
  selectedCharacterId: number | null = null;

  breadcrumbs: BreadcrumbItem[] = [];
  showPostForm = signal<boolean>(true);
  loadProfiles = true;
  showAccount = true;

  postsPerPage = 15;
  totalPages = computed(() => {
    const totalPosts = this.topic()?.post_number || 0;
    return Math.ceil(totalPosts / this.postsPerPage);
  });

  private destroy$ = new Subject<void>();

  @ViewChild(PostFormComponent) postForm!: PostFormComponent;

  constructor() {
    // Effect for breadcrumbs and profile loading
    effect(() => {
      const t = this.topic();
      const s = this.subforum();

      if (t.id !== 0) {
        if (s?.id !== t.subforum_id) {
           this.forumService.loadSubforum(t.subforum_id);
        }

        this.breadcrumbs = [
          { label: 'Home', link: '/' },
          ...(s ? [{ label: s.name, link: `/viewforum/${s.id}` }] : []),
          { label: t.name }
        ];

        if (t.type === TopicType.character) {
          this.loadProfiles = false;
          this.showAccount = true;
        } else if (t.type === TopicType.episode) {
          this.loadProfiles = false;
          this.showAccount = false;
          this.characterService.loadUserCharacterProfilesForTopic(t.id);
        } else if (t.type === TopicType.general) {
          this.loadProfiles = false;
          this.showAccount = true;
          this.characterService.loadUserCharacterProfilesForTopic(t.id);
        }
      }
    });

    // Effect for showing/hiding post form
    effect(() => {
      const t = this.topic();
      const profiles = this.userCharacterProfiles();

      if (t.type === TopicType.episode) {
        this.showPostForm.set(profiles.length > 0);
      } else {
        this.showPostForm.set(true);
      }
    });
  }

  isEpisode() { return this.topic().type === TopicType.episode; }
  isGeneral() { return this.topic().type === TopicType.general; }
  isCharacter() { return this.topic().type === TopicType.character; }

  ngOnInit() {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([paramMap, queryParamMap]) => {
        const topicId = Number(paramMap.get('id'));
        const page = coerceToPage(queryParamMap.get('page'));

        if (topicId) {
          // Only reload the main topic data if the ID has actually changed
          if (this.topic().id !== topicId) {
            this.topicService.loadTopic(topicId);
          }
          // Always reload posts for the current page
          this.topicService.loadPosts(topicId, page);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCharacterSelected(characterId: number | null) {
    this.selectedCharacterId = characterId;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const message = this.postForm.messageField.nativeElement.value;

    if (!message || !this.id) return;

    const payload = {
      topic_id: +this.id,
      content: message,
      use_character_profile: this.selectedCharacterId !== null,
      character_profile_id: this.selectedCharacterId
    };

    this.topicService.createPost(payload).subscribe({
      next: () => {
        this.postForm.messageField.nativeElement.value = '';
        // After posting, the WebSocket event will trigger a redirect if needed
      },
      error: (err) => console.error('Failed to create post', err)
    });
  }
}
