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
  permissions: SubforumPermissions|null;
}

export interface SubforumShort {
  id: number;
  name: string;
}

export interface SubforumPermissions {
  subforum_create_general_topic: boolean;
  subforum_create_episode_topic: boolean;
  subforum_create_character_topic: boolean;
  subforum_post: boolean;
  subforum_delete_topic: boolean;
  subforum_delete_others_topic: boolean;
  subforum_edit_others_post: boolean;
  subforum_edit_own_post: boolean;
}
