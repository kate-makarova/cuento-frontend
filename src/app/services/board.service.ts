import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Board } from '../models/Board';

@Injectable({ providedIn: 'root' })
export class BoardService {
  // Use inject() for a more modern Angular style, or use the constructor
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost/api/board/info';

  private boardSignal = signal<Board>({
    site_name: "",
    domain: "",
    total_user_number: 0,
    total_character_number: 0,
    total_topic_number: 0,
    total_post_number: 0,
    total_episode_number: 0,
    total_episode_post_number: 0,
    last_registered_user: null
  });
  readonly board = this.boardSignal.asReadonly();

  loadBoard(): void {
    this.http.get<Board>(this.apiUrl).subscribe({
      next: (data) => {
        this.boardSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load board info', err);
        // Handle error (e.g., set a default state or alert user)
      }
    });
  }
}
