import { Component, inject, OnInit } from '@angular/core';
import { TopicCreateComponent } from '../topic-create/topic-create.component';
import { EpisodeCreateComponent } from '../episode-create/episode-create.component';
import { CharacterCreateComponent } from '../character-create/character-create.component';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-topic-create-wrapper',
  imports: [CommonModule, TopicCreateComponent, EpisodeCreateComponent, CharacterCreateComponent],
  templateUrl: './topic-create-wrapper.component.html',
  styleUrl: './topic-create-wrapper.component.css'
})
export class TopicCreateWrapperComponent implements OnInit {
  selectedType = 'topic-create';
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.selectedType = params['type'];
      }
    });
  }
}
