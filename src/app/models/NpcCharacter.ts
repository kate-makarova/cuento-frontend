import { CustomFieldsData } from './Character';
import { Faction } from './Faction';

export interface NpcTopic {
  topic_id: number;
  topic_title: string;
  post_ids: number[];
}

export interface NpcCharacter {
  id: number;
  name: string;
  avatar: string | null;
  custom_fields: CustomFieldsData;
  factions: Faction[] | null;
  campaign_id?: number | null;
  topics?: NpcTopic[];
}
