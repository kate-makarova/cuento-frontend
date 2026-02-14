import {Component, inject, OnInit} from '@angular/core';
import {CharacterService} from '../services/character.service';

@Component({
  selector: 'app-character-create',
  imports: [],
  templateUrl: './character-create.component.html',
  standalone: true,
  styleUrl: './character-create.component.css'
})
export class CharacterCreateComponent implements OnInit
{
  characterService = inject(CharacterService);
  characterTemplate = this.characterService.characterTemplate;

  ngOnInit() {
    this.characterService.loadCharacterTemplate();
  }
}
