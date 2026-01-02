import { Component } from '@angular/core';
import {Character} from '../models/Character';
import {User} from '../models/User';
import {RouterLink} from '@angular/router';
import {Topic} from '../models/Topic';
import {UserShort} from '../models/UserShort';
import {LongTextFieldDisplayComponent} from '../components/long-text-field-display/long-text-field-display.component';
import {
  ShortTextFieldDisplayComponent
} from '../components/short-text-field-display/short-text-field-display.component';

@Component({
  selector: 'app-characterview',
  imports: [
    RouterLink,
    LongTextFieldDisplayComponent,
    ShortTextFieldDisplayComponent
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
  new UserShort(1, 'Username',  ''),
  'House Harkonnen',
  'Close Circle'
);
isOwner: boolean = true;
recentTopics: Topic[] = [
  new Topic(1, 'Episode 1',  1,
    '2025-12-12', '2025-12-12')
];
}
