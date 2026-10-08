import { FactionShort } from './Faction';

export enum ArcStatus {
  Pending = 0,
  Active = 1,
  Archived = 2,
  Finished = 3
}

export interface ShortUser {
  id: number;
  username: string;
  avatar?: string | null;
}

export interface StoryArc {
  id: number;
  title: string;
  description?: string | null;
  is_public: boolean;
  status: ArcStatus;
  image_url?: string | null;
  thumbnail_url?: string | null;
  creator_id?: number | null;
  factions: FactionShort[];
  game_masters: ShortUser[];
  episode_count: number;
}

export interface ArcFilterRequest {
  statuses?: number[];
  faction_ids?: number[];
  search?: string;
  page?: number;
}

export interface ArcListResponse {
  items: StoryArc[];
  total_pages: number;
}
