import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { ApiService } from './api.service';

export type EntityDraftType = 'character' | 'wanted_character';

export interface EntityDraftMeta {
  id: number;
  draft_id: string;
}

export interface EntityDraftResponse extends EntityDraftMeta {
  content: any;
}

@Injectable({ providedIn: 'root' })
export class EntityDraftService {
  private apiService = inject(ApiService);

  loadLatest(entityType: EntityDraftType): Observable<EntityDraftResponse> {
    return this.apiService.get<EntityDraftResponse[]>(`post-draft/entity/${entityType}/latest`).pipe(
      map(drafts => {
        if (!drafts?.length) throw new Error('no draft');
        return drafts[0];
      })
    );
  }

  save(entityType: EntityDraftType, content: any, draftId?: number | null): Observable<EntityDraftMeta> {
    const body = { entity_type: entityType, content: JSON.stringify(content), is_manual: false };
    if (draftId) {
      return this.apiService.post<EntityDraftMeta>(`post-draft/update/${draftId}`, body);
    }
    return this.apiService.post<EntityDraftMeta>('post-draft/create', body);
  }

  delete(draftId: number): Observable<void> {
    return this.apiService.get<void>(`post-draft/delete/${draftId}`);
  }
}
