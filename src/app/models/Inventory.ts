export interface InventoryItem {
  id: number;
  arc_id: number;
  name: string;
  description: string | null;
  icon: string | null;
  is_hidden: boolean;
  display_order: number;
  can_edit?: boolean;
}

export interface InventoryEntry {
  item_id: number;
  name: string;
  description: string | null;
  icon: string | null;
  quantity: number;
}

export interface SceneInventory {
  profile_id: number;
  name: string;
  is_mask: boolean;
  owner_user_id: number;
  owner_username: string;
  exists: boolean;
  is_locked: boolean;
  locked_at?: string;
  items: InventoryEntry[];
}

export interface ArcInventory {
  enabled: boolean;
  in_use: boolean;
  can_edit: boolean;
  items: InventoryItem[];
}

export interface SceneInventories {
  episode_id: number;
  topic_id: number;
  name: string;
  status: number;
  arc_id: number;
  catalogue: InventoryItem[];
  inventories: SceneInventory[];
}

export interface PostInventory {
  profile_id: number;
  name: string;
  items: InventoryEntry[];
}

export interface InventoryQuantity {
  item_id: number;
  quantity: number;
}

export interface InventoryItemRequest {
  name?: string;
  description?: string;
  icon?: string;
  is_hidden?: boolean;
  display_order?: number;
}
