import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-topic-read-by',
  imports: [CommonModule, RouterLink],
  templateUrl: './topic-read-by.component.html',
  standalone: true,
  styleUrl: './topic-read-by.component.css'
})
export class TopicReadByComponent {
  guestsCount = 0;
  usersCount = 2;
  users = [
    { id: 1333, name: 'viper', groupClass: 'group4' },
    { id: 11, name: 'Химера', groupClass: 'group4' }
  ];
}
