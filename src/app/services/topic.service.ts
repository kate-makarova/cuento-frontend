import {Injectable, input, signal} from '@angular/core';
import {delay, of} from 'rxjs';
import {Topic} from '../models/Topic';

@Injectable({ providedIn: 'root' })
export class TopicService {
  private topicListSignal = signal<Topic[]>([]);
  readonly topicList = this.topicListSignal.asReadonly();

  loadTopicList(forumId: number, page: number, pageSize: number) {
    const data = [
      new Topic(1, 'My First Episode', 'Something', forumId, '2025-12-12', '2025-12-15'),
      new Topic(2, 'My Second Episode', 'Something', forumId, '2025-12-12', '2025-12-15'),
      new Topic(3, 'My Third Episode', 'Something', forumId, '2025-12-12', '2025-12-15'),
      new Topic(4, 'My Fourth Episode', 'Something', forumId, '2025-12-12', '2025-12-15'),
    ];
    of(data).pipe(delay(500)).subscribe(data => {
      this.topicListSignal.set(data);
    });
  }
}
