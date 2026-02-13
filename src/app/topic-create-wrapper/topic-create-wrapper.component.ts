import { Component } from '@angular/core';
import { TopicCreateComponent } from '../topic-create/topic-create.component';
import { EpisodeCreateComponent } from '../episode-create/episode-create.component';
import { CharacterCreateComponent } from '../character-create/character-create.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topic-create-wrapper',
  imports: [CommonModule, TopicCreateComponent, EpisodeCreateComponent, CharacterCreateComponent],
  templateUrl: './topic-create-wrapper.component.html',
  styleUrl: './topic-create-wrapper.component.css'
})
export class TopicCreateWrapperComponent {
  selectedType = 'topic-create';

  onTypeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedType = select.value;
  }
}
