import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Topic} from '../models/Topic';

@Injectable({ providedIn: 'root' })
export class ForumService {
  private topics = signal<Topic[]>([]);
  readonly subforumTopics = this.topics.asReadonly();

  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost/api/viewforum/';

  loadSubforumPage(subforum: number, page: number = 1) {
    this.http.get<Topic[]>(this.apiUrl + subforum + '/' + page).subscribe({
      next: (data) => {
        this.topics.set(data);
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        // Handle error (e.g., set a default state or alert user)
      }
    });
  }
}
