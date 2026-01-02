import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Character} from '../models/Character';
import {User} from '../models/User';
import {UserShort} from '../models/UserShort';

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
    'mentat',
    '2025-12-12', new UserShort(1, 'viper',  '')
  );

  saveCharacter(event: Event) {}
  goBack() {}
}
