import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { InteractiveMap, MapConfig } from '../models/InteractiveMap';

export interface CreateMapRequest {
  title: string;
  config: MapConfig;
  is_public: boolean;
}

export interface UpdateMapRequest {
  title?: string;
  config?: MapConfig;
  is_public?: boolean;
}

@Injectable({ providedIn: 'root' })
export class InteractiveMapService {
  private apiService = inject(ApiService);

  getMap(id: number): Observable<InteractiveMap> {
    return this.apiService.get<InteractiveMap>(`interactive-map/${id}`);
  }

  getMapList(): Observable<InteractiveMap[]> {
    return this.apiService.get<InteractiveMap[]>('interactive-map/list');
  }

  createMap(data: CreateMapRequest): Observable<InteractiveMap> {
    return this.apiService.post<InteractiveMap>('interactive-map/create', data);
  }

  updateMap(id: number, data: UpdateMapRequest): Observable<InteractiveMap> {
    return this.apiService.post<InteractiveMap>(`interactive-map/update/${id}`, data);
  }

  deleteMap(id: number): Observable<void> {
    return this.apiService.post<void>(`interactive-map/delete/${id}`, {});
  }
}
