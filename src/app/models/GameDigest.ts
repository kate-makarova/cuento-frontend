export interface GameDigest {
  id: number;
  implementation_id: number;
  datetime: string;
  text: string;
  is_published: boolean;
  published_post_id: number | null;
  published_user_id: number | null;
}

export interface UpdateGameDigestRequest {
  is_published?: boolean;
  published_post_id?: number | null;
  published_user_id?: number | null;
}

export interface GameDigestEpisodeNote {
  episode_id: number;
  notes: unknown | null;
}

export interface GameDigestSetting {
  setting_name: string;
  setting_value: unknown | null;
}
