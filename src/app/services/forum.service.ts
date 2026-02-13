import {inject, Injectable, signal} from '@angular/core';
import {ApiService} from './api.service';
import {Topic} from '../models/Topic';

@Injectable({ providedIn: 'root' })
export class ForumService {
  private topics = signal<Topic[]>([]);
  readonly subforumTopics = this.topics.asReadonly();

  private apiService = inject(ApiService);

  loadSubforumPage(subforum: number, page: number = 1) {
    this.apiService.get<Topic[]>('viewforum/' + subforum + '/' + page).subscribe({
      next: (data) => {
        this.topics.set(data);
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      }
    });
  }
}
