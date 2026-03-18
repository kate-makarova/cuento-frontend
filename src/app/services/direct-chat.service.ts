import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { DirectChatListItem, DirectChatResponse } from '../models/DirectChat';
import { Message } from '../models/Message';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DirectChatService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  private chatListSignal = signal<DirectChatListItem[]>([]);
  readonly chatList = this.chatListSignal.asReadonly();

  private currentChatSignal = signal<DirectChatResponse | null>(null);
  readonly currentChat = this.currentChatSignal.asReadonly();

  private messagesSignal = signal<Message[]>([]);
  readonly messages = this.messagesSignal.asReadonly();

  loadDirectChat(chatId: number): void {
    this.apiService.get<DirectChatResponse>(`direct-chat/${chatId}`).subscribe({
      next: (data) => this.currentChatSignal.set(data),
      error: (err) => console.error('Failed to load direct chat', err)
    });
  }

  loadMessages(chatId: number): void {
    this.apiService.get<Message[]>(`direct-chat/${chatId}/messages`).subscribe({
      next: (data) => this.messagesSignal.set(data),
      error: (err) => console.error('Failed to load messages', err)
    });
  }

  loadChatList(): void {
    this.apiService.get<DirectChatListItem[]>('direct-chats').subscribe({
      next: (data) => this.chatListSignal.set(data),
      error: (err) => console.error('Failed to load direct chats', err)
    });
  }

  createChat(recipientId: number): Observable<{ chat_id: number }> {
    return this.apiService.post<{ chat_id: number }>('direct-chat/create', { recipient_id: recipientId });
  }

  prependChat(item: DirectChatListItem): void {
    this.chatListSignal.update(list => [item, ...list]);
  }

  sendMessage(content: string): Observable<any> {
    const chat = this.currentChatSignal();
    if (!chat) throw new Error('No active chat');

    const currentUserId = this.authService.currentUser()!.id;
    const author = chat.participants.find(p => p.id === currentUserId)!;
    const receiver = chat.participants.find(p => p.id !== currentUserId)!;

    if (!author.public_key || !receiver.public_key) throw new Error('Missing public keys');

    return from(this.buildMessagePayload(chat.chat_id, content, author.public_key, receiver.public_key)).pipe(
      switchMap(payload => this.apiService.post('direct-chat/message', payload))
    );
  }

  private async buildMessagePayload(chatId: number, content: string, authorKey: string, receiverKey: string) {
    const [authorEncrypted, receiverEncrypted] = await Promise.all([
      this.encryptForParticipant(content, authorKey),
      this.encryptForParticipant(content, receiverKey)
    ]);

    return {
      chat_id: chatId,
      content_author: authorEncrypted.content,
      content_receiver: receiverEncrypted.content,
      iv_author: authorEncrypted.iv,
      iv_receiver: receiverEncrypted.iv
    };
  }

  private async encryptForParticipant(content: string, publicKeyBase64: string): Promise<{ content: string; iv: string }> {
    const rsaPublicKey = await crypto.subtle.importKey(
      'spki',
      this.base64ToBuffer(publicKeyBase64),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );

    const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      new TextEncoder().encode(content)
    );

    const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
    const wrappedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsaPublicKey, rawAesKey);

    // RSA-2048 always produces 256 bytes; concatenate wrapped key + ciphertext so the receiver can split them
    const combined = new Uint8Array(wrappedKey.byteLength + ciphertext.byteLength);
    combined.set(new Uint8Array(wrappedKey), 0);
    combined.set(new Uint8Array(ciphertext), wrappedKey.byteLength);

    return {
      content: this.bufferToBase64(combined),
      iv: this.bufferToBase64(iv)
    };
  }

  private base64ToBuffer(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  }

  private bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }
}
