import {CharacterShort, CustomFieldsData} from './Character';

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
