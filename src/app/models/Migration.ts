export enum MigrationStatus {
  Pending = 0,
  Processed = 1,
  Published = 2
}

export interface ProcessingUser {
  original_user_id: string;
  original_user_name: string;
  character_id: number | null;
  character_name: string | null;
  user_id: number | null;
}

export interface ProcessingResult {
  found_posts: number;
  skipped_duplicates: number;
  all_parsed: boolean;
  found_users: ProcessingUser[];
}

export interface Migration {
  id: number;
  date_created: string;
  user_id: number;
  status: number;
  original_topic_id: string;
  original_topic_title: string | null;
  new_topic_id: number | null;
  original_post_count: number;
  parsed_post_count: number | null;
  forum_domain?: string;
  data_extraction_urls?: string[];
  user_character_map?: Record<string, ProcessingUser>;
}
