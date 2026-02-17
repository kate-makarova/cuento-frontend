import {Episode} from './Episode';

export interface Topic {
  id: number;
  name: string;
  subforum_id: number;
  date_created: string;
  date_last_post: string;
  author_user_id: number;
  author_username: string;
  post_number: number;
  last_post_author_user_id: number|null;
  last_post_author_username: string|null;
  type: TopicType;
  status: TopicStatus;
  episode: Episode|null;
}

export enum TopicType {
  general = 0,
  episode = 1,
  character = 2
}

export enum TopicStatus {
  active = 0,
  inactive = 1
}
