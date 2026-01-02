import {Component} from '@angular/core';
import {Character} from '../models/Character';
import {RouterLink} from '@angular/router';
import {UserShort} from '../models/UserShort';

@Component({
  selector: 'app-character-list',
  imports: [
    RouterLink
  ],
  templateUrl: './character-list.component.html',
  styleUrl: './character-list.component.css'
})
export class CharacterListComponent {
  characters: Character[] = [
    new Character(1, 'Feyd-Rautha Harkonnen', '', 'active', '2025-12-12',
      new UserShort(1, 'Antilia', ''), 'House Harkonnen'),
    new Character(2, 'Piter de Vries', '', 'active', '2025-12-12',
      new UserShort(1, 'viper', ''), 'House Harkonnen'),
    new Character(3, 'Ariste Atreides', '', 'active', '2025-12-12',
      new UserShort(1, 'ari', ''), 'House Atreides'),
  ];

  // Helper to get unique groups
  get groups() {
    return [...new Set(this.characters.map(c => c.group || 'Без фракции'))];
  }

  getCharactersByGroup(group: string | null) {
    return this.characters.filter(c => (c.group || 'Без фракции') === group);
  }
}
