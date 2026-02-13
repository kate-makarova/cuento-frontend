import {Component, inject, Input, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ForumService} from '../services/forum.service';

@Component({
  selector: 'app-viewforum',
  imports: [
    RouterLink,
  ],
  templateUrl: './viewforum.component.html',
  styleUrl: './viewforum.component.css'
})
export class ViewforumComponent implements OnInit {
  forumService = inject(ForumService);
  @Input() id?: number;
  @Input() page?: number;
  topics = this.forumService.subforumTopics;

  ngOnInit(): void {
    if(this.id) {
      this.forumService.loadSubforumPage(this.id, this.page)
    }
  }
}
