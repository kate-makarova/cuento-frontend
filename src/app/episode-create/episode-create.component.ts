import { Component } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-episode-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './episode-create.component.html',
  styleUrl: './episode-create.component.css'
})
export class EpisodeCreateComponent {
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
