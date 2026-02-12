import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';
import {Episode} from '../models/Episode';
import {Subforum} from '../models/Subforum';
import {CharacterShort} from '../models/CharacterShort';
import {FormsModule} from '@angular/forms';
import {Character} from '../models/Character';
import {TopicStatus} from '../models/Topic';

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
  protected topics: Episode[] = [];
  protected subforums: Subforum[] = [];
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

  protected readonly TopicStatus = TopicStatus;
}
