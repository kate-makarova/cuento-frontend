import { FactionShort } from './Faction';
import { UserShort } from './UserShort';

export type { UserShort };

export enum ArcStatus {
  Pending = 0,
  Active = 1,
  Archived = 2,
  Finished = 3
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
  game_masters: UserShort[];
  episode_count: number;
  can_edit?: boolean;
  subforum_id?: number | null;
}

export interface ArcEpisode {
  id: number;
  title: string;
  status: number;
  last_post_date: string | null;
  last_post_author: UserShort | null;
  characters: { id: number; name: string; avatar: string | null }[];
  factions: FactionShort[];
}

export interface ArcCreateRequest {
  title: string;
  description?: string;
  status: number;
  is_public: boolean;
  image_url?: string;
  faction_ids: number[];
  game_master_ids: number[];
}

export interface ArcUpdateRequest {
  title?: string;
  description?: string;
  status?: number;
  is_public?: boolean;
  image_url?: string;
  faction_ids?: number[];
  game_master_ids?: number[];
}

export interface ArcNpc {
  id: number;
  name: string;
  avatar: string | null;
  description: string | null;
  display_order: number;
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
