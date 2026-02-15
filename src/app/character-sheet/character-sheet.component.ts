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

  newChar = {
    id: 0,
    name: '',
    image: '',
    status: '',
    createdAt: '',
    user: {
      id: 0,
      username: '',
      avatar: null
    },
    group: '',
    subgroup: '',
    subsubgroup: '',
    customFields: []
  }

  saveCharacter(event: Event) {}
  goBack() {}
}
