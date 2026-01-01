import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Character} from '../models/Character';
import {User} from '../models/User';

@Component({
  selector: 'app-character-sheet',
  imports: [
    FormsModule
  ],
  templateUrl: './character-sheet.component.html',
  styleUrl: './character-sheet.component.css'
})
export class CharacterSheetComponent {

  newChar = new Character(
    1, 'Piter the Mentat', '',
    'mentat', 'scheming', 'Bio',
    '2025-12-12', new User(1, 'viper', 'viper@test.com', '')
  );

  saveCharacter(event: Event) {}
  goBack() {}
}
