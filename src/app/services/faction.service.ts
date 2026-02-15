import { Injectable, signal, inject, effect } from '@angular/core';
import { ApiService } from './api.service';
import { Faction } from '../models/Faction';

@Injectable({ providedIn: 'root' })
export class FactionService {
  private apiService = inject(ApiService);

  // Signal to hold the current faction ID. 0 represents the root.
  currentFactionId = signal<number>(0);

  // Signal to hold the children of the current faction
  currentFactionChildren = signal<Faction[]>([]);

  constructor() {
    // Effect to automatically load children whenever currentFactionId changes
    effect(() => {
      const parentId = this.currentFactionId();
      this.loadFactionChildren(parentId);
    });
  }

  loadFactionChildren(id: number): void {
    console.log('Loading faction children for id:', id);
    this.apiService.get<Faction[]>(`faction-children/${id}/get`).subscribe({
      next: (data) => {
        console.log('Received faction children:', data);
        this.currentFactionChildren.set(data);
      },
      error: (err) => {
        console.error('Failed to load faction children', err);
        this.currentFactionChildren.set([]);
      }
    });
  }

  // Method to update the current faction, which triggers the effect
  setCurrentFaction(id: number) {
    this.currentFactionId.set(id);
  }
}
