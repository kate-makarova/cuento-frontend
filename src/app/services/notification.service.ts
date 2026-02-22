import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { PostCreatedEvent, TopicCreatedEvent, NotificationEvent, WebSocketEvent, TopicViewersUpdateEvent } from '../models/event';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private authService = inject(AuthService);
  private ws: WebSocket | null = null;
  private readonly url: string;
  private token: string | null = null;

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 1000;
  private maxReconnectInterval = 30000;
  private reconnectTimer: number | null = null;

  private postCreatedSubject = new Subject<PostCreatedEvent>();
  public postCreated$ = this.postCreatedSubject.asObservable();

  private topicCreatedSubject = new Subject<TopicCreatedEvent>();
  public topicCreated$ = this.topicCreatedSubject.asObservable();

  private notificationSubject = new Subject<NotificationEvent>();
  public notification$ = this.notificationSubject.asObservable();

  private topicViewersUpdateSubject = new Subject<TopicViewersUpdateEvent>();
  public topicViewersUpdate$ = this.topicViewersUpdateSubject.asObservable();

  private messageQueue: string[] = [];
  private explicitlyClosed = false;

  constructor() {
    const baseUrl = 'http://localhost:8080';
    this.url = baseUrl.replace(/^http/, 'ws') + '/ws';
  }

  public connect(authToken: string): void {
    // If we are already connected with the same token, do nothing
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.token === authToken) {
      return;
    }

    // If we are connected but the token has changed, close and reconnect
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('NotificationService: Token changed, reconnecting...');
      this.ws.close();
    }

    if (!authToken) {
      console.error('Auth token is required.');
      return;
    }
    this.token = authToken;
    this.explicitlyClosed = false;
    this._doConnect();
  }

  public disconnect(): void {
    if (this.ws) {
      this.explicitlyClosed = true;
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.ws.close();
    }
  }

  public sendMessage(message: unknown): void {
    const msgString = JSON.stringify(message);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msgString);
    } else {
      this.messageQueue.push(msgString);
    }
  }

  public sendPageChange(pageType: string, pageId: number): void {
    this.sendMessage({
      type: 'page_change',
      page_type: pageType,
      page_id: pageId
    });
  }

  private _doConnect(): void {
    if (!this.token) return;
    const urlWithAuth = `${this.url}?token=${this.token}`;
    this.ws = new WebSocket(urlWithAuth);

    this.ws.onopen = () => {
      console.log('NotificationService: Connection established.');
      this.reconnectAttempts = 0;
      this.processMessageQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        this.handleNotification(JSON.parse(event.data));
      } catch (error) {
        console.error('Error parsing message.', error);
      }
    };

    this.ws.onclose = (event) => {
      this.ws = null;
      if (!this.explicitlyClosed) {
        console.warn(`NotificationService: Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        // If the closure might be auth-related (e.g. 1008 Policy Violation is often used for auth), try refreshing
        // But standard codes vary. We'll try to refresh if we haven't exhausted attempts.
        this.handleConnectionFailure();
      }
    };
  }

  private handleConnectionFailure() {
    // Try to refresh token before reconnecting
    console.log('NotificationService: Attempting to refresh token before reconnecting...');
    this.authService.refreshToken().subscribe({
      next: (response) => {
        console.log('NotificationService: Token refreshed successfully.');
        this.token = response.access_token;
        this.scheduleReconnect();
      },
      error: (err) => {
        console.error('NotificationService: Token refresh failed.', err);
        // If refresh fails, we might still try to reconnect with old token or give up?
        // Usually if refresh fails, we are logged out.
        // But let's try standard reconnect backoff just in case it was a network blip
        this.scheduleReconnect();
      }
    });
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg = this.messageQueue.shift();
      if (msg) this.ws.send(msg);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('NotificationService: Max reconnect attempts reached.');
      return;
    }
    this.reconnectAttempts++;
    const backoff = Math.min(this.maxReconnectInterval, this.reconnectInterval * Math.pow(2, this.reconnectAttempts));
    const jitter = backoff * 0.5 * Math.random();
    const timeout = backoff - jitter;
    console.log(`NotificationService: Scheduling reconnect in ${Math.round(timeout / 1000)}s.`);
    this.reconnectTimer = window.setTimeout(() => this._doConnect(), timeout);
  }

  private handleNotification(notification: WebSocketEvent): void {
    switch (notification.type) {
      case 'post_created':
        this.postCreatedSubject.next(notification as PostCreatedEvent);
        break;
      case 'topic_created':
        this.topicCreatedSubject.next(notification as TopicCreatedEvent);
        break;
      case 'notification':
        this.notificationSubject.next(notification as NotificationEvent);
        break;
      case 'topic_viewers_update':
        this.topicViewersUpdateSubject.next(notification as TopicViewersUpdateEvent);
        break;
      default:
        console.warn('Unknown notification type:', notification);
    }
  }
}
