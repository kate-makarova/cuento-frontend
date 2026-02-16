import {inject, Injectable, signal} from '@angular/core';
import {Episode} from '../models/Episode';
import {ApiService} from './api.service';
import {TopicType, TopicStatus} from '../models/Topic';
import {SubforumShort} from '../models/Subforum';

@Injectable({ providedIn: 'root' })
export class EpisodeService {
  private apiService = inject(ApiService);
  private topicSignal = signal<Episode>({
    id: 0,
    name: '',
    forum_id: 0,
    created_at: '',
    date_last_post: '',
    author_user_id: 0,
    author_username: '',
    post_number: 0,
    last_post_author_user_id: null,
    last_post_author_username: null,
    type: TopicType.general,
    posts: [],
    status: TopicStatus.active,
    summary: '',
    characters: [],
    image: null
  });
  readonly topic = this.topicSignal.asReadonly();
  private topicListSignal = signal<Episode[]>([]);
  readonly topicList = this.topicListSignal.asReadonly();

  private subforumListSignal = signal<SubforumShort[]>([]);
  readonly subforumList = this.subforumListSignal.asReadonly();

  loadSubforumList() {
    this.apiService.get<SubforumShort[]>('subforum/list-short').subscribe({
      next: (data) => {
        this.subforumListSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load subforum list', err);
      }
    })
  }

}
