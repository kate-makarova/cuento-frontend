import { Component } from '@angular/core';
import {Character} from '../models/Character';
import {User} from '../models/User';
import {RouterLink} from '@angular/router';
import {Topic} from '../models/Topic';

@Component({
  selector: 'app-characterview',
  imports: [
    RouterLink
  ],
  templateUrl: './characterview.component.html',
  styleUrl: './characterview.component.css'
})
export class CharacterviewComponent {
char: Character = new Character(
  1,
    'Character Name',
    '',
    'elf',
    'shooting',
    'Typical elf bio',
  '2025-12-12',
  new User(1, 'Username', 'user@test.com', '')
);
isOwner: boolean = true;
recentTopics: Topic[] = [
  new Topic(1, 'Episode 1', 'ttt', '2025-12-12', '2025-12-12')
];
}
