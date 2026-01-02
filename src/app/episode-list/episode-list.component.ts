import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';
import {Episode} from '../models/Episode';
import {Subforum} from '../models/Subforum';
import {CharacterShort} from '../models/CharacterShort';
import {FormsModule} from '@angular/forms';
import {Character} from '../models/Character';

@Component({
  selector: 'app-episode-list',
  imports: [
    RouterLink,
    FormsModule
  ],
  templateUrl: './episode-list.component.html',
  styleUrl: './episode-list.component.css'
})
export class EpisodeListComponent {
  protected currentPage: number = 1;
  protected totalPages: number = 1;
  protected characterGroups: string[] = [
    'House Harkonnen',
    'House Atreides'
  ];
  protected topics: Episode[] = [
    new Episode(1, 'My Dear Na-Baron', 1, '2025-12-12', '2025-12-12',
      [new CharacterShort(1, 'Piter de Vries', '')], '', '')
  ];
  protected subforums: Subforum[] = [
    new Subforum(1, 'Present', '', 2, 1),
    new Subforum(2, 'Past', '', 3, 2),
    new Subforum(3, 'Future', '', 4, 3)
  ];
  protected selectedCharacters: CharacterShort[] = [];
  protected searchQuery: string = '';

  protected isSelected(id: number) {

  }

  protected toggleForum(id: number) {

  }

  protected searchChars($event: Event) {

  }

  protected removeChar(id: number) {

  }

  protected toggleGroup(group: any) {

  }
}
