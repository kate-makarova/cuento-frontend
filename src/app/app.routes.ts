import { Routes } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {ViewforumComponent} from './viewforum/viewforum.component';
import {ViewtopicComponent} from './viewtopic/viewtopic.component';
import {MessengerComponent} from './messenger/messenger.component';
import {UserProfileComponent} from './user-profile/user-profile.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Home page',
    data: { pageId: 'pun-index' }
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
];
