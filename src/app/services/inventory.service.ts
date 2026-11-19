import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ArcInventory, InventoryItem, InventoryItemRequest, InventoryQuantity, PostInventory, SceneInventories, SceneInventory,
} from '../models/Inventory';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private apiService = inject(ApiService);

  getArcInventory(arcId: number): Observable<ArcInventory> {
    return this.apiService.get<ArcInventory>(`arc/${arcId}/inventory/items`);
  }

  setArcInventory(arcId: number, enabled: boolean): Observable<{ enabled: boolean }> {
    return this.apiService.post<{ enabled: boolean }>(`arc/${arcId}/inventory/${enabled ? 'enable' : 'disable'}`, {});
  }

  getItem(id: number): Observable<InventoryItem> {
    return this.apiService.get<InventoryItem>(`inventory/item/${id}`);
  }

  createItem(arcId: number, data: InventoryItemRequest): Observable<{ id: number }> {
    return this.apiService.post<{ id: number }>('inventory/item/create', { arc_id: arcId, ...data });
  }

  updateItem(id: number, data: InventoryItemRequest): Observable<void> {
    return this.apiService.post<void>(`inventory/item/update/${id}`, data);
  }

  deleteItem(id: number): Observable<void> {
    return this.apiService.delete<void>(`inventory/item/delete/${id}`);
  }

  setSceneInventory(episodeId: number, useInventory: boolean): Observable<void> {
    return this.apiService.post<void>(`episode/${episodeId}/inventory/settings`, { use_inventory: useInventory });
  }

  getSceneInventories(episodeId: number): Observable<SceneInventories> {
    return this.apiService.get<SceneInventories>(`episode/${episodeId}/inventories`);
  }

  saveSceneInventory(episodeId: number, profileId: number, items: InventoryQuantity[]): Observable<void> {
    return this.apiService.post<void>(`episode/${episodeId}/inventory/${profileId}/update`, { items });
  }

  lockSceneInventory(episodeId: number, profileId: number): Observable<void> {
    return this.apiService.post<void>(`episode/${episodeId}/inventory/${profileId}/lock`, {});
  }

  startScene(episodeId: number): Observable<{ episode_status: number }> {
    return this.apiService.post<{ episode_status: number }>(`episode/${episodeId}/start`, {});
  }

  getCurrentInventories(episodeId: number): Observable<SceneInventory[]> {
    return this.apiService.get<SceneInventory[]>(`episode/${episodeId}/inventory/current`);
  }

  getPostInventory(postId: number): Observable<PostInventory> {
    return this.apiService.get<PostInventory>(`post/${postId}/inventory`);
  }
}
