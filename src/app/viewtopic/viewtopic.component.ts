import {Component, effect, inject, Input, OnInit, ViewChild} from '@angular/core';
import {PostFormComponent} from '../components/post-form/post-form.component';
import {TopicService} from '../services/topic.service';
import {RouterLink} from '@angular/router';
import {
  ShortTextFieldDisplayComponent
} from '../components/short-text-field-display/short-text-field-display.component';
import {LongTextFieldDisplayComponent} from '../components/long-text-field-display/long-text-field-display.component';
import {CommonModule} from '@angular/common';
import {CharacterProfileComponent} from '../components/character-profile/character-profile.component';
import {TopicType} from '../models/Topic';
import {EpisodeHeaderComponent} from '../components/episode-header/episode-header.component';
import {Post} from '../models/Post';
import {BreadcrumbItem, BreadcrumbsComponent} from '../components/breadcrumbs/breadcrumbs.component';
import {ForumService} from '../services/forum.service';
import {TopicReadByComponent} from '../components/topic-read-by/topic-read-by.component';

@Component({
  selector: 'app-viewtopic',
  imports: [
    PostFormComponent,
    RouterLink,
    CommonModule,
    CharacterProfileComponent,
    EpisodeHeaderComponent,
    BreadcrumbsComponent,
    TopicReadByComponent
  ],
  templateUrl: './viewtopic.component.html',
  standalone: true,
  styleUrl: './viewtopic.component.css'
})
export class ViewtopicComponent implements OnInit {
  topicService = inject(TopicService);
  forumService = inject(ForumService);
  @Input() id?: number;
  @Input() page: number = 1;

  topic = this.topicService.topic;
  posts = this.topicService.posts;
  subforum = this.forumService.subforum;

  accountName = 'User123'; // This should come from AuthService
  selectedCharacterId: number | null = null;

  breadcrumbs: BreadcrumbItem[] = [];

  @ViewChild(PostFormComponent) postForm!: PostFormComponent;

  constructor() {
    effect(() => {
      const t = this.topic();
      const s = this.subforum();

      if (t.id !== 0) {
        // If we have topic, we might need to load subforum if not already loaded or different
        if (s?.id !== t.subforum_id) {
           this.forumService.loadSubforum(t.subforum_id);
        }

        this.breadcrumbs = [
          { label: 'Home', link: '/' },
          ...(s ? [{ label: s.name, link: `/viewforum/${s.id}` }] : []),
          { label: t.name }
        ];
      }
    });
  }

  isEpisode() {
    return this.topic().type === TopicType.episode;
  }

  isGeneral() {
    return this.topic().type === TopicType.general;
  }

  isCharacter() {
    return this.topic().type === TopicType.character;
  }

  ngOnInit() {
    if (this.id) {
      this.topicService.loadTopic(this.id);
      this.topicService.loadPosts(this.id, this.page);
    }
  }

  onCharacterSelected(characterId: number | null) {
    this.selectedCharacterId = characterId;
    console.log('Selected character ID:', this.selectedCharacterId);
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
        console.log('Post created successfully');
        this.postForm.messageField.nativeElement.value = '';
      },
      error: (err) => console.error('Failed to create post', err)
    });
  }
}
