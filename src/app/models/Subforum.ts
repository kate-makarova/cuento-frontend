import {Category} from './Category';

export interface Subforum {
  id: number;
  name: string;
  description: string;
  category_id: number;
  position: number;
  can_read_roles: string[];
  can_wrote_roles: string[];
  topic_number: number;
  post_number: number;
  is_game_subforum: boolean;
}
