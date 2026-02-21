import {Component, effect, inject, Input, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ForumService} from '../services/forum.service';
import {BreadcrumbItem, BreadcrumbsComponent} from '../components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-viewforum',
  imports: [
    RouterLink,
    BreadcrumbsComponent
  ],
  templateUrl: './viewforum.component.html',
  standalone: true,
  styleUrl: './viewforum.component.css'
})
export class ViewforumComponent implements OnInit {
  forumService = inject(ForumService);
  @Input() id?: number;
  @Input() page?: number;
  topics = this.forumService.subforumTopics;
  subforum = this.forumService.subforum;

  breadcrumbs: BreadcrumbItem[] = [];

  constructor() {
    effect(() => {
      const sub = this.subforum();
      if (sub) {
        this.breadcrumbs = [
          { label: 'Home', link: '/' },
          { label: sub.name }
        ];
      }
    });
  }

  ngOnInit(): void {
    if(this.id) {
      this.forumService.loadSubforumPage(this.id, this.page)
      this.forumService.loadSubforum(this.id);
    }
  }
}
