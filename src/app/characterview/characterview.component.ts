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
  standalone: true,
  styleUrl: './characterview.component.css'
})
export class CharacterviewComponent {
char: Character = {
  id: 0,
  name: '',
  avatar: '',
  character_status: 0,
  createdAt: '',
  user: {
    id: 0,
    username: '',
    avatar: null
  },
  group: '',
  subgroup: '',
  subsubgroup: '',
  custom_fields: {
    custom_fields: {},
    field_config: []
  }
}
isOwner: boolean = true;
recentTopics: Topic[] = [];
}
