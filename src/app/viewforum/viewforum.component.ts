import {Component, inject, Input, input, OnInit} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {TopicService} from '../services/topic.service';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-viewforum',
  imports: [
    RouterLink,
    NgIf
  ],
  templateUrl: './viewforum.component.html',
  styleUrl: './viewforum.component.css'
})
export class ViewforumComponent implements OnInit {
  topicService = inject(TopicService);
  @Input() id?: number;

  ngOnInit(): void {
    if(this.id) {
      this.topicService.loadTopicList(this.id, 1, 20)
    }
  }

}
