import {UserProfile} from './User';
import {CharacterProfile} from './Character';


export interface Post {
  id: number;
  topic_id: number;
  user_profile: UserProfile|null;
  use_character_profile: boolean;
  character_profile: CharacterProfile|null;
  content: string;
  content_html: string;
  date_created: string;
}
