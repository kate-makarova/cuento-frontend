import {Injectable, input, signal} from '@angular/core';
import {delay, of} from 'rxjs';
import {Topic} from '../models/Topic';
import {Episode} from '../models/Episode';
import {CharacterShort} from '../models/CharacterShort';
import {UserProfile} from '../models/UserProfile';
import {CharacterProfile} from '../models/CharacterProfile';
import {Post} from '../models/Post';
import {Field} from '../models/Field';

@Injectable({ providedIn: 'root' })
export class TopicService {
  private topicListSignal = signal<Topic[]>([]);
  readonly topicList = this.topicListSignal.asReadonly();
  private topicSignal = signal<Topic>(new Topic(0, '', 0, '', ''));
  readonly topic = this.topicSignal.asReadonly();

  loadTopicList(forumId: number, page: number, pageSize: number) {
    const data = [
      new Topic(1, 'My First Episode',  forumId, '2025-12-12', '2025-12-15'),
      new Topic(2, 'My Second Episode',  forumId, '2025-12-12', '2025-12-15'),
      new Topic(3, 'My Third Episode',  forumId, '2025-12-12', '2025-12-15'),
      new Topic(4, 'My Fourth Episode', forumId, '2025-12-12', '2025-12-15'),
    ];
    of(data).pipe(delay(500)).subscribe(data => {
      this.topicListSignal.set(data);
    });
  }

  loadTopic(topicId: number) {
    let topic = new Episode(
      1, 'My First Episode', 1,
      '2025-12-12', '2025-12-15', [new CharacterShort(
        1, 'Piter', '')], 'Summary', ''
    );

    const userProfile = new UserProfile(
      1, 'Viper', ''
    );
    const characterProfile = new CharacterProfile(
      1, 'Piter', '', [
        new Field('description', 'Description',
          'A mentat', 'display', 'long_text', false)
      ]
    );

    topic.posts = [
      new Post(1, topic.id, userProfile, 'Message', '2025-12-12', characterProfile, true),
      new Post(2, topic.id, userProfile, 'Message 2', '2025-12-12'),
    ]
    of(topic).pipe(delay(500)).subscribe(data => {
      this.topicSignal.set(topic);
    });
  }
}
