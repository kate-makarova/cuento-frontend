import { Component, inject, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterSheetHeaderComponent } from '../components/character-sheet-header/character-sheet-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { CharacterService } from '../services/character.service';

@Component({
  selector: 'app-characterview',
  imports: [
    RouterLink,
    CharacterSheetHeaderComponent,
    CommonModule,
    DatePipe
  ],
  templateUrl: './characterview.component.html',
  standalone: true,
  styleUrl: './characterview.component.css'
})
export class CharacterviewComponent implements OnInit {
  @Input() id?: number;

  private characterService = inject(CharacterService);

  character = this.characterService.character;

  ngOnInit() {
    if (this.id) {
      this.characterService.loadCharacter(this.id);
    }
  }
}
