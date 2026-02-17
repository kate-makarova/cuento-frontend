import {TopicStatus, TopicType} from './Topic';
import {CharacterShort, CustomFieldsData} from './Character';
import {Post} from './Post';

// export interface Episode {
//   id: number;
//   name: string;
//   forum_id: number;
//   created_at: string;
//   date_last_post: string;
//   author_user_id: number;
//   author_username: string;
//   post_number: number;
//   last_post_author_user_id: number|null;
//   last_post_author_username: string|null;
//   type: TopicType;
//   status: TopicStatus;
//
//  characters: CharacterShort[];
//  custom_fields: CustomFieldsData;
// }

export interface Episode {
  id: number;
  name: string;
  characters: CharacterShort[];
  custom_fields: CustomFieldsData;
}

export interface EpisodeFilterRequest {
  subforum_ids: number[];
  character_ids: number[];
  faction_ids: number[];
  page: number;
}

export interface EpisodeListItem {
  id: number;
  name: string;
  topic_id: number;
  subforum_id: number;
  subforum_name: string;
  topic_status: number;
  last_post_date: string;
}

export interface CreateEpisodeRequest {
subforum_id: number;
name: string;
character_ids: number[];
custom_fields: any;
}
