import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { DirectChatListItem } from '../models/DirectChat';

@Injectable({ providedIn: 'root' })
export class DirectChatService {
  private apiService = inject(ApiService);

  private chatListSignal = signal<DirectChatListItem[]>([]);
  readonly chatList = this.chatListSignal.asReadonly();

  loadChatList(): void {
    this.apiService.get<DirectChatListItem[]>('direct-chats').subscribe({
      next: (data) => this.chatListSignal.set(data),
      error: (err) => console.error('Failed to load direct chats', err)
    });
  }
}
