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
  last_post_topic_id: number;
  last_post_topic_name: string;
  last_post_id: number;
  date_last_post_id: string;
  last_post_author_user_name: string;
}

export interface SubforumShort {
  id: number;
  name: string;
}
