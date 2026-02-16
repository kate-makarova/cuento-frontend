import {inject, Injectable, signal} from '@angular/core';
import {EpisodeListItem, EpisodeFilterRequest} from '../models/Episode';
import {ApiService} from './api.service';
import {TopicType, TopicStatus} from '../models/Topic';
import {SubforumShort} from '../models/Subforum';

@Injectable({ providedIn: 'root' })
export class EpisodeService {
  private apiService = inject(ApiService);
  private topicSignal = signal<EpisodeListItem>({
    id: 0,
    name: '',
    topic_id: 0,
    subforum_id: 0,
    subforum_name: '',
    topic_status: TopicStatus.active,
    last_post_date: ''
  });
  readonly topic = this.topicSignal.asReadonly();
  private topicListSignal = signal<EpisodeListItem[]>([]);
  readonly topicList = this.topicListSignal.asReadonly();

  private subforumListSignal = signal<SubforumShort[]>([]);
  readonly subforumList = this.subforumListSignal.asReadonly();

  private episodeListPageSignal = signal<EpisodeListItem[]>([]);
  readonly episodeListPage = this.episodeListPageSignal.asReadonly();

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

  loadEpisodeListPage(page: number, request: EpisodeFilterRequest) {
    this.apiService.post<EpisodeListItem[]>(`episodes/get`, request).subscribe({
      next: (data) => {
        this.episodeListPageSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load episode list page', err);
      }
    })
  }

}
