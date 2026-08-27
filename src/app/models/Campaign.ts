import { CharacterShort } from './Character';
import { NpcCharacter } from './NpcCharacter';
import { UserShort } from './UserShort';

export interface CampaignEpisode {
  id: number;
  name: string;
}

export interface Campaign {
  id: number;
  title: string;
  summary: string;
  status: number;
  date_created: string;
  start_date: string | null;
  end_date: string | null;
  characters: CharacterShort[];
  episodes: CampaignEpisode[];
  npc_characters: NpcCharacter[];
  game_masters: UserShort[];
  is_gm?: boolean;
}
