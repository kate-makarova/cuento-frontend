import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {CharacterService} from '../services/character.service';
import {inject} from '@angular/core';

@Component({
  selector: 'app-character-list',
  imports: [
    RouterLink
  ],
  templateUrl: './character-list.component.html',
  standalone: true,
  styleUrl: './character-list.component.css'
})
export class CharacterListComponent {
  characterService = inject(CharacterService);
  characterList = this.characterService.characterList;


  ngOnInit() {
    this.characterService.loadCharacterList();
  }
}
