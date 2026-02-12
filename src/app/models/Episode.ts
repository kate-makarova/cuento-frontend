import {TopicStatus, TopicType} from './Topic';
import {CharacterShort} from './CharacterShort';
import {Post} from './Post';

export interface Episode {
  id: number;
  name: string;
  forum_id: number;
  created_at: string;
  date_last_post: string;
  author_user_id: number;
  author_username: string;
  post_number: number;
  last_post_author_user_id: number|null;
  last_post_author_username: string|null;
  type: TopicType;
  posts: Post[];
  status: TopicStatus;

 summary: string;
 characters: CharacterShort[];
 image: string|null;
}
