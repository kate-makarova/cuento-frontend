import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { FieldTemplate } from "../models/FieldTemplate";
import { Faction } from "../models/Faction";
import { CharacterShort } from "../models/Character";

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private apiService = inject(ApiService);
  private characterTemplateSignal = signal<FieldTemplate[]>([]);
  readonly characterTemplate = this.characterTemplateSignal.asReadonly();
  private characterListSignal = signal<Faction[]>([]);
  readonly characterList = this.characterListSignal.asReadonly();
  private shortCharacterListSignal = signal<CharacterShort[]>([]);
  readonly shortCharacterList = this.shortCharacterListSignal.asReadonly();

  loadCharacterTemplate(): void {
    this.apiService.get<FieldTemplate[]>('template/character/get').subscribe({
      next: (data) => {
        const sortedData = data.sort((a, b) => a.order - b.order);
        this.characterTemplateSignal.set(sortedData);
      },
      error: (err) => {
        console.error('Failed to load character template', err);
      }
    });
  }

  loadCharacterList(): void {
    this.apiService.get<Faction[]>('character-list').subscribe({
      next: (data) => {
        this.characterListSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load character list', err);
      }
    })
  }

  saveCharacterTemplate(template: FieldTemplate[]): void {
    this.apiService.post('template/character/update', template).subscribe({
      next: (data) => {
        console.log('Character template saved successfully', data);
      },
      error: (err) => {
        console.error('Failed to save character template', err);
      }
    })
  }

  loadShortCharacterList(term: string): void {
    if (!term || term.trim() === '') {
      this.shortCharacterListSignal.set([]);
      return;
    }
    this.apiService.get<CharacterShort[]>(`character-autocomplete/${term}`).subscribe({
      next: (data) => {
        this.shortCharacterListSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load short character list', err);
        this.shortCharacterListSignal.set([]); // Clear on error as well
      }
    })
  }
}
