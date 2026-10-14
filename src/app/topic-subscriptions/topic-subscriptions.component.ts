import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ForumService } from '../services/forum.service';
import { BreadcrumbItem, BreadcrumbsComponent } from '../components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-topic-subscriptions',
  host: { class: 'pun-page' },
  imports: [RouterLink, BreadcrumbsComponent],
  templateUrl: './topic-subscriptions.component.html',
  standalone: true,
})
export class TopicSubscriptionsComponent implements OnInit {
  private forumService = inject(ForumService);

  topics = this.forumService.subscribedTopics;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', link: '/' },
    { label: 'My Subscriptions' }
  ];

  ngOnInit() {
    this.forumService.loadSubscribedTopics();
  }
}
