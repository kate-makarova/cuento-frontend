import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ArcNpc } from '../models/StoryArc';

export interface NpcCreateRequest {
  arc_id: number;
  name: string;
  avatar?: string;
  description?: string;
  display_order?: number;
}

export interface NpcUpdateRequest {
  name?: string;
  avatar?: string;
  description?: string;
  display_order?: number;
}

export interface NpcTopic {
  topic_id: number;
  topic_name: string;
  post_ids: number[];
}

@Injectable({ providedIn: 'root' })
export class NpcService {
  private apiService = inject(ApiService);

  getNpc(id: number): Observable<ArcNpc> {
    return this.apiService.get<ArcNpc>(`npc/${id}`);
  }

  getNpcTopics(id: number): Observable<NpcTopic[]> {
    return this.apiService.get<NpcTopic[]>(`npc/${id}/topics`);
  }

  createNpc(data: NpcCreateRequest): Observable<{ id: number }> {
    return this.apiService.post<{ id: number }>('npc/create', data);
  }

  updateNpc(id: number, data: NpcUpdateRequest): Observable<ArcNpc> {
    return this.apiService.post<ArcNpc>(`npc/update/${id}`, data);
  }

  deleteNpc(id: number): Observable<void> {
    return this.apiService.get<void>(`npc/delete/${id}`);
  }
}
