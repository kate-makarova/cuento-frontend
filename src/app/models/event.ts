import { Post } from './Post';

export interface TopicCreatedEvent {
  type: 'topic_created';
  TopicID: number;
  SubforumID: number;
  Title: string;
  PostID: number;
  UserID: number;
  Username: string;
}

export interface PostCreatedEvent {
  type: 'post_created';
  topic_id: number;
  subforum_id: number;
  post: Post;
}

export interface NotificationEvent {
  type: 'notification';
  user_id: number;
  message_type: string; // Renamed from 'type' to avoid conflict with event type
  message: string;
  data?: any;
}

export type WebSocketEvent = TopicCreatedEvent | PostCreatedEvent | NotificationEvent;
