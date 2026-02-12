import {Injectable, signal} from '@angular/core';
import {Topic, TopicStatus, TopicType} from '../models/Topic';

@Injectable({ providedIn: 'root' })
export class TopicService {
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
    posts: [],
    status: TopicStatus.active
  });
  readonly topic = this.topicSignal.asReadonly();
}
