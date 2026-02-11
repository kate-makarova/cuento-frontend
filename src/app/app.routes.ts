import { Routes } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {ViewforumComponent} from './viewforum/viewforum.component';
import {ViewtopicComponent} from './viewtopic/viewtopic.component';
import {MessengerComponent} from './messenger/messenger.component';
import {UserProfileComponent} from './user-profile/user-profile.component';
import {CharacterSheetComponent} from './character-sheet/character-sheet.component';
import {CharacterviewComponent} from './characterview/characterview.component';
import {CharacterListComponent} from './character-list/character-list.component';
import {EpisodeListComponent} from './episode-list/episode-list.component';
import {LoginComponent} from './login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Home page',
    data: { pageId: 'pun-index' }
  },
  {
    path: 'login',
    component: LoginComponent,
    data: { pageId: 'pun-login' }
  },
  {
    path: 'messenger',
    component: MessengerComponent,
    data: { pageId: 'pun-messenger' }
  },
  {
    path: 'viewforum/:id',
    component: ViewforumComponent,
    title: 'View Forum',
    data: { pageId: 'pun-viewforum' }
  },
  {
    path: 'viewtopic/:id',
    component: ViewtopicComponent,
    data: { pageId: 'pun-viewtopic' }
  },
  {
    path: 'profile/:id',
    component: UserProfileComponent,
    title: 'User Profile',
    data: { pageId: 'pun-profile' }
  },
  {
    path: 'character/:id',
    component: CharacterviewComponent,
    title: 'Character',
    data: { pageId: 'pun-character' }
  },
  {
    path: 'character-list',
    component: CharacterListComponent,
    title: 'Character List',
    data: { pageId: 'pun-character-list' }
  },
  {
    path: 'episode-list',
    component: EpisodeListComponent,
    title: 'Episode List',
    data: { pageId: 'pun-episode-list' }
  },
  {
    path: 'character-sheet/new',
    component: CharacterSheetComponent,
    title: 'New Character Sheet',
    data: { pageId: 'pun-character-sheet' }
  },
];
