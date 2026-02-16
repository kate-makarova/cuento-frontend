import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EpisodeService } from '../services/episode.service';
import { ShortTextFieldComponent } from '../components/short-text-field/short-text-field.component';
import { LongTextFieldComponent } from '../components/long-text-field/long-text-field.component';
import { ImageFieldComponent } from '../components/image-field/image-field.component';

@Component({
  selector: 'app-episode-create',
  imports: [CommonModule, ReactiveFormsModule, ShortTextFieldComponent, LongTextFieldComponent, ImageFieldComponent],
  templateUrl: './episode-create.component.html',
  standalone: true,
  styleUrl: './episode-create.component.css'
})
export class EpisodeCreateComponent implements OnInit {
  episodeService = inject(EpisodeService);
  episodeTemplate = this.episodeService.episodeTemplate;

  // Character inputs
  characterControls = new FormArray([new FormControl('')]);
  allCharacters = [
    { id: 1, name: 'Hero Knight' },
    { id: 2, name: 'Dark Mage' },
    { id: 3, name: 'Elf Archer' },
    { id: 4, name: 'Dwarf Warrior' },
    { id: 5, name: 'Human Rogue' }
  ];
  filteredCharacters: any[][] = [];

  constructor() {
    this.setupAutocomplete(0);
  }

  ngOnInit() {
    this.episodeService.loadEpisodeTemplate();
  }

  setupAutocomplete(index: number) {
    this.characterControls.at(index).valueChanges.subscribe(value => {
      this.filterCharacters(index, value || '');
    });
  }

  filterCharacters(index: number, query: string) {
    if (!query) {
      this.filteredCharacters[index] = [];
      return;
    }
    const lowerQuery = query.toLowerCase();
    this.filteredCharacters[index] = this.allCharacters.filter(char =>
      char.name.toLowerCase().includes(lowerQuery)
    );
  }

  selectCharacter(index: number, charName: string) {
    this.characterControls.at(index).setValue(charName);
    this.filteredCharacters[index] = [];
  }

  addCharacterField() {
    this.characterControls.push(new FormControl(''));
    this.setupAutocomplete(this.characterControls.length - 1);
  }

  removeCharacterField(index: number) {
    if (this.characterControls.length > 1) {
      this.characterControls.removeAt(index);
      this.filteredCharacters.splice(index, 1);
    }
  }
}
