import {Component, inject, Input, OnInit} from '@angular/core';
import {PostFormComponent} from '../post-form/post-form.component';
import {TopicService} from '../services/topic.service';
import {RouterLink} from '@angular/router';
import {
  ShortTextFieldDisplayComponent
} from '../components/short-text-field-display/short-text-field-display.component';
import {LongTextFieldDisplayComponent} from '../components/long-text-field-display/long-text-field-display.component';

@Component({
  selector: 'app-viewtopic',
  imports: [
    PostFormComponent,
    RouterLink,
    ShortTextFieldDisplayComponent,
    LongTextFieldDisplayComponent
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
