import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { UserShort } from '../models/UserShort';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiService = inject(ApiService);

  private usersOnPageSignal = signal<UserShort[]>([]);
  readonly usersOnPage = this.usersOnPageSignal.asReadonly();

  loadUsersOnPage(pageType: string, pageId: number): void {
    this.apiService.get<UserShort[]>(`users/page/${pageType}/${pageId}`).subscribe({
      next: (data) => {
        this.usersOnPageSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load users on page', err);
        this.usersOnPageSignal.set([]);
      }
    });
  }
}
