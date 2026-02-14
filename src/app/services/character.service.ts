import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { FieldTemplate } from "../models/FieldTemplate";

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private apiService = inject(ApiService);
  private characterTemplateSignal = signal<FieldTemplate[]>([]);
  readonly characterTemplate = this.characterTemplateSignal.asReadonly();

  loadCharacterTemplate(): void {
    this.apiService.get<FieldTemplate[]>('character-template/get').subscribe({
      next: (data) => {
        this.characterTemplateSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load character template', err);
      }
    });
  }
}
