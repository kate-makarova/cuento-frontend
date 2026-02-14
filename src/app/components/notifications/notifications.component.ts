import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Announcement {
  id: number;
  title: string;
  date: string;
  preview: string;
}

interface GamePost {
  id: number;
  episodeName: string;
  episodeId: number;
  author: string;
  date: string;
}

interface NewGame {
  id: number;
  episodeName: string;
  subforum: string;
  characters: string[];
  date: string;
}

@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent {
  notifications = signal({
    announcements: 2,
    myGamePosts: 5,
    newGames: 1,
    systemMessages: 1
  });

  activeModal: string | null = null;

  // Mock Data
  announcements: Announcement[] = [
    { id: 1, title: 'Server Maintenance', date: '2023-10-27', preview: 'We will be performing scheduled maintenance on...' },
    { id: 2, title: 'New Feature Released', date: '2023-10-25', preview: 'Check out the new character sheet builder...' }
  ];

  systemMessages: Announcement[] = [
     { id: 1, title: 'Welcome!', date: '2023-10-20', preview: 'Welcome to the new forum platform...' }
  ];

  myGamePosts: GamePost[] = [
    { id: 101, episodeName: 'The Dark Tower', episodeId: 5, author: 'Gandalf', date: '2023-10-27 14:30' },
    { id: 102, episodeName: 'Into the Woods', episodeId: 8, author: 'Legolas', date: '2023-10-26 09:15' }
  ];

  newGames: NewGame[] = [
    { id: 201, episodeName: 'A New Hope', subforum: 'Star Wars', characters: ['Luke', 'Leia'], date: '2023-10-27' }
  ];

  openModal(type: string) {
    this.activeModal = type;
  }

  closeModal() {
    this.activeModal = null;
  }
}
