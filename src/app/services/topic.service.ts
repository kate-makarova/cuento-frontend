import {inject, Injectable, signal} from '@angular/core';
import {Topic, TopicStatus, TopicType} from '../models/Topic';
import {Episode} from '../models/Episode';
import {ApiService} from './api.service';

@Injectable({ providedIn: 'root' })
export class TopicService {
  private apiService = inject(ApiService);
  private topicTypeSignal = signal<TopicType>(TopicType.general);
  readonly topicType = this.topicTypeSignal.asReadonly();

  private topicSignal = signal<Topic>({
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
    status: TopicStatus.active
  });
  readonly topic = this.topicSignal.asReadonly();

  private episodeSignal = signal<Episode>({
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
    type: TopicType.episode,
    status: TopicStatus.active,
    characters: [],
    custom_fields: {
      custom_fields: {},
      field_config: []
    }
  });
  readonly episode = this.episodeSignal.asReadonly();

  loadTopic(id: number) {
    this.apiService.get<any>('topic/get/' + id.toString()).subscribe(data => {
      switch(data.type) {
        case TopicType.general:
          this.topicSignal.set({
            ...data
          });
          break;
        case TopicType.episode:
          this.episodeSignal.set({
            ...data
          });
          break;
        case TopicType.character:
          this.topicSignal.set({
            ...data,
            type: TopicType.character
          });
          break;
          default:
            this.topicSignal.set({
              ...data,
              type: TopicType.general
            });
      }
      this.topicTypeSignal.set(data.type);
    });
  }
}


