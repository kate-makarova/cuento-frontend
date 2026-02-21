import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PostCreatedEvent, TopicCreatedEvent, NotificationEvent, WebSocketEvent } from '../models/event';

/**
 * A service for handling live notifications via WebSockets.
 * It includes a robust reconnection strategy with exponential backoff and jitter.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private token: string | null = null;

  // Reconnection strategy parameters
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 1000; // Initial reconnect delay (1s)
  private maxReconnectInterval = 30000; // Max reconnect delay (30s)
  private reconnectTimer: number | null = null;

  private postCreatedSubject = new Subject<PostCreatedEvent>();
  public postCreated$ = this.postCreatedSubject.asObservable();

  private topicCreatedSubject = new Subject<TopicCreatedEvent>();
  public topicCreated$ = this.topicCreatedSubject.asObservable();

  private notificationSubject = new Subject<NotificationEvent>();
  public notification$ = this.notificationSubject.asObservable();

  private messageQueue: string[] = [];

  /**
   * A flag to indicate if the disconnection was intentional (e.g., user logout).
   * This prevents reconnection attempts on explicit disconnects.
   */
  private explicitlyClosed = false;

  constructor() {
    const baseUrl = 'http://localhost:8080'; // Hardcoded for now, should be from config
    this.url = baseUrl.replace(/^http/, 'ws') + '/ws';
  }

  /**
   * Establishes the WebSocket connection.
   * Should be called after the user is authenticated.
   * @param authToken The user's authentication token.
   */
  public connect(authToken: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('NotificationService: WebSocket is already connected.');
      return;
    }

    if (!authToken) {
      console.error('NotificationService: Auth token is required to connect.');
      return;
    }

    this.token = authToken;
    this.explicitlyClosed = false;
    this._doConnect();
  }

  /**
   * Closes the WebSocket connection permanently.
   * Should be called on user logout.
   */
  public disconnect(): void {
    if (this.ws) {
      console.log('NotificationService: Disconnecting explicitly.');
      this.explicitlyClosed = true;
      // Clear any pending reconnect timers
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.ws.close();
    }
  }

  /**
   * Sends a message to the server.
   * @param message The data to send, which will be JSON.stringified.
   */
  public sendMessage(message: unknown): void {
    const msgString = JSON.stringify(message);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msgString);
    } else {
      console.log('NotificationService: WebSocket not open, queuing message.');
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

  /**
   * The core connection logic.
   */
  private _doConnect(): void {
    if (!this.token) {
      console.error("NotificationService: Cannot connect without an auth token.");
      return;
    }

    // NOTE: Appending the token to the URL is a common method for WebSocket
    // authentication, but be aware of the security implications (e.g., tokens in server logs).
    const urlWithAuth = `${this.url}?token=${this.token}`;
    this.ws = new WebSocket(urlWithAuth);

    this.ws.onopen = () => {
      console.log('NotificationService: Connection established.');
      // On a successful connection, reset the reconnect counter.
      this.reconnectAttempts = 0;
      this.processMessageQueue();
    };

    this.ws.onmessage = (event) => {
      console.log('NotificationService: Message received.', event.data);
      // Process the incoming notification
      try {
        const notification = JSON.parse(event.data);
        this.handleNotification(notification);
      } catch (error) {
        console.error('NotificationService: Error parsing incoming message.', error);
      }
    };

    this.ws.onerror = (event) => {
      console.error('NotificationService: WebSocket error.', event);
      // The 'error' event is typically followed by a 'close' event,
      // which is where we'll handle the reconnection logic.
    };

    this.ws.onclose = (event) => {
      this.ws = null;
      if (this.explicitlyClosed) {
        console.log('NotificationService: Connection closed intentionally.');
      } else {
        console.warn(`NotificationService: Connection closed unexpectedly. Code: ${event.code}, Reason: ${event.reason}`);
        this.scheduleReconnect();
      }
    };
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg = this.messageQueue.shift();
      if (msg) {
        this.ws.send(msg);
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('NotificationService: Max reconnect attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff with jitter to prevent thundering herd
    const backoff = Math.min(this.maxReconnectInterval, this.reconnectInterval * Math.pow(2, this.reconnectAttempts));
    const jitter = backoff * 0.5 * Math.random();
    const timeout = backoff - jitter;

    console.log(`NotificationService: Scheduling reconnect in ${Math.round(timeout / 1000)}s (attempt ${this.reconnectAttempts}).`);

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
      default:
        console.warn('NotificationService: Unknown notification type:', notification);
    }
  }
}
