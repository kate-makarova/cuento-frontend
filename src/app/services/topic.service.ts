import {inject, Injectable, signal} from '@angular/core';
import {Topic, TopicStatus, TopicType} from '../models/Topic';
import {ApiService} from './api.service';

@Injectable({ providedIn: 'root' })
export class TopicService {
  private apiService = inject(ApiService);

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
    status: TopicStatus.active,
    episode: null
  });
  readonly topic = this.topicSignal.asReadonly();


  loadTopic(id: number) {
    this.apiService.get<any>('topic/get/' + id.toString()).subscribe(data => {
      this.topicSignal.set(data.type);
    });
  }
}


