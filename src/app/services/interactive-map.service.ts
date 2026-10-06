import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { InteractiveMap, MapConfig } from '../models/InteractiveMap';

@Injectable({ providedIn: 'root' })
export class InteractiveMapService {
  private apiService = inject(ApiService);

  getMap(id: number): Observable<InteractiveMap> {
    return this.apiService.get<InteractiveMap>(`interactive-map/${id}`);
  }

  getMapList(): Observable<InteractiveMap[]> {
    return this.apiService.get<InteractiveMap[]>('interactive-map/list');
  }

  saveMap(id: number, config: MapConfig): Observable<InteractiveMap> {
    return this.apiService.put<InteractiveMap>(`interactive-map/${id}`, { config });
  }
}
