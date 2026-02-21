import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-topic-read-by',
  imports: [CommonModule, RouterLink],
  templateUrl: './topic-read-by.component.html',
  standalone: true,
  styleUrl: './topic-read-by.component.css'
})
export class TopicReadByComponent implements OnInit {
  @Input() topicId!: number;
  private userService = inject(UserService);
  users = this.userService.usersOnPage;

  ngOnInit() {
    if (this.topicId) {
      this.userService.loadUsersOnPage('topic', this.topicId);
    }
  }
}
