export interface LorePage {
  topic_id: number;
  post_id?: number | null;
  name: string;
  is_hidden: boolean;
  order: number;
  is_external_link: boolean;
  external_link: string | null;
}

export interface LorePageInfo {
  id: number;
  post_id: number | null;
  name: string;
  is_hidden: boolean;
  order: number;
  is_external_link: boolean;
  external_link: string | null;
}

export interface LoreTopicPostRow {
  id: number;
  date_created: string;
  lore_page: LorePageInfo | null;
}
