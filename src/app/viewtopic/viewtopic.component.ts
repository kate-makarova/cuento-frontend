import {Component, effect, inject, Input, OnInit, Signal} from '@angular/core';
import {PostFormComponent} from '../components/post-form/post-form.component';
import {TopicService} from '../services/topic.service';
import {RouterLink} from '@angular/router';
import {
  ShortTextFieldDisplayComponent
} from '../components/short-text-field-display/short-text-field-display.component';
import {LongTextFieldDisplayComponent} from '../components/long-text-field-display/long-text-field-display.component';
import {CommonModule} from '@angular/common';
import {CharacterProfileComponent} from '../components/character-profile/character-profile.component';
import {TopicType} from '../models/Topic';
import {EpisodeHeaderComponent} from '../components/episode-header/episode-header.component';
import {Post} from '../models/Post';

@Component({
  selector: 'app-viewtopic',
  imports: [
    PostFormComponent,
    RouterLink,
    ShortTextFieldDisplayComponent,
    LongTextFieldDisplayComponent,
    CommonModule,
    CharacterProfileComponent,
    EpisodeHeaderComponent
  ],
  templateUrl: './viewtopic.component.html',
  standalone: true,
  styleUrl: './viewtopic.component.css'
})
export class ViewtopicComponent implements OnInit {
  topicService = inject(TopicService);
  @Input() id?: number;

  topic = this.topicService.topic;
  episode = this.topicService.episode;
  topicType = this.topicService.topicType;
  entity: Signal<any> = this.topic;
  posts:Post[] = []

  accountName = 'User123'; // This should come from AuthService
  selectedCharacterId: number | null = null;

  constructor() {
    effect(() => {
      const type = this.topicType();
      if (type === TopicType.episode ) {
        this.entity = this.episode;
      } else {
        this.entity = this.topic;
      }
    });
  }

  isEpisode() {
    return this.topicType() === TopicType.episode;
  }

  isGeneral() {
    return this.topicType() === TopicType.general;
  }

  isCharacter() {
    return this.topicType() === TopicType.character;
  }

  ngOnInit() {
    if (this.id) {
      this.topicService.loadTopic(this.id);
    }
  }

  onCharacterSelected(characterId: number | null) {
    this.selectedCharacterId = characterId;
    console.log('Selected character ID:', this.selectedCharacterId);
  }
}
