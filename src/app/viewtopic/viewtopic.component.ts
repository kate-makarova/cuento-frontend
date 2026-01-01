import {Component, inject, Input, OnInit} from '@angular/core';
import {PostFormComponent} from '../post-form/post-form.component';
import {TopicService} from '../services/topic.service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-viewtopic',
  imports: [
    PostFormComponent,
    RouterLink
  ],
  templateUrl: './viewtopic.component.html',
  styleUrl: './viewtopic.component.css'
})
export class ViewtopicComponent implements OnInit {
  topicService = inject(TopicService);
  @Input() id?: number;

  ngOnInit() {
    if (this.id) {
      this.topicService.loadTopic(this.id);
    }
  }
}
