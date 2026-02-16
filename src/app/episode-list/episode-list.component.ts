import {Component, inject, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {Episode} from '../models/Episode';
import {CharacterShort} from '../models/Character';
import {FormsModule} from '@angular/forms';
import {TopicStatus} from '../models/Topic';
import {EpisodeService} from '../services/episode.service';
import {CharacterService} from '../services/character.service';
import {CommonModule} from '@angular/common';
import {debounceTime, distinctUntilChanged, Subject} from 'rxjs';


@Component({
  selector: 'app-episode-list',
  imports: [
    RouterLink,
    FormsModule,
    CommonModule
  ],
  templateUrl: './episode-list.component.html',
  standalone: true,
  styleUrl: './episode-list.component.css'
})
export class EpisodeListComponent implements OnInit {
  protected currentPage: number = 1;
  protected totalPages: number = 1;
  protected characterGroups: string[] = [
    'House Harkonnen',
    'House Atreides'
  ];
  protected topics: Episode[] = [];
  protected selectedCharacters: CharacterShort[] = [];
  protected selectedSubforums: number[] = [];
  protected searchQuery: string = '';
  protected characterSearchQuery: string = '';
  protected episodeService = inject(EpisodeService);
  protected characterService = inject(CharacterService);
  protected subforums = this.episodeService.subforumList;
  protected characterSuggestions = this.characterService.shortCharacterList;

  // Subject to handle search input debouncing
  private characterSearchTerms = new Subject<string>();

  constructor() {
    this.episodeService.loadSubforumList();
  }

  public ngOnInit(): void {
    this.characterSearchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.characterService.loadShortCharacterList(term);
    });
  }

  protected isSelected(id: number): boolean {
    return this.selectedSubforums.includes(id);
  }

  protected toggleForum(id: number): void {
    const index = this.selectedSubforums.indexOf(id);
    if (index > -1) {
      this.selectedSubforums.splice(index, 1);
    } else {
      this.selectedSubforums.push(id);
    }
  }

  protected onSearchChange() {
    this.characterSearchTerms.next(this.characterSearchQuery);
  }

  protected selectCharacter(character: CharacterShort) {
    // Check if character is not already selected
    if (!this.selectedCharacters.find(c => c.id === character.id)) {
      this.selectedCharacters.push(character);
    }
    // Clear search
    this.characterSearchQuery = '';
    // Clear suggestions in service
    this.characterService.loadShortCharacterList('');
  }

  protected removeChar(id: number) {
    const index = this.selectedCharacters.findIndex(c => c.id === id);
    if (index > -1) {
      this.selectedCharacters.splice(index, 1);
    }
  }

  protected toggleGroup(group: any) {

  }

  protected readonly TopicStatus = TopicStatus;
}
