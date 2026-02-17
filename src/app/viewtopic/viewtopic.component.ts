import {Component, inject, Input, OnInit} from '@angular/core';
import {PostFormComponent} from '../components/post-form/post-form.component';
import {TopicService} from '../services/topic.service';
import {RouterLink} from '@angular/router';
import {
  ShortTextFieldDisplayComponent
} from '../components/short-text-field-display/short-text-field-display.component';
import {LongTextFieldDisplayComponent} from '../components/long-text-field-display/long-text-field-display.component';
import {CommonModule} from '@angular/common';
import {CharacterProfileComponent} from '../components/character-profile/character-profile.component';

@Component({
  selector: 'app-viewtopic',
  imports: [
    PostFormComponent,
    RouterLink,
    ShortTextFieldDisplayComponent,
    LongTextFieldDisplayComponent,
    CommonModule,
    CharacterProfileComponent
  ],
  templateUrl: './viewtopic.component.html',
  standalone: true,
  styleUrl: './viewtopic.component.css'
})
export class ViewtopicComponent {
  topicService = inject(TopicService);
  @Input() id?: number;

  accountName = 'User123'; // This should come from AuthService
  selectedCharacterId: number | null = null;

  ngOnInit() {
  }

  onCharacterSelected(characterId: number | null) {
    this.selectedCharacterId = characterId;
    console.log('Selected character ID:', this.selectedCharacterId);
  }
}
