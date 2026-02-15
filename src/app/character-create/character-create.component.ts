import {Component, inject, OnInit} from '@angular/core';
import {CharacterService} from '../services/character.service';
import {ShortTextFieldComponent} from '../components/short-text-field/short-text-field.component';
import {LongTextFieldComponent} from '../components/long-text-field/long-text-field.component';
import {ImageFieldComponent} from '../components/image-field/image-field.component';

@Component({
  selector: 'app-character-create',
  imports: [ShortTextFieldComponent, LongTextFieldComponent, ImageFieldComponent],
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
