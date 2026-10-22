import { Component, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

interface WeeklyChronicle {
  date_from: string;
  date_to: string;
  text: string;
}

interface WantedCharacterIdea {
  topic_id: number;
  name: string;
  author_username: string;
  date_created: string;
  faction_name: string | null;
}

interface NewContentItem {
  topic_id: number;
  name: string;
}

interface NewContent {
  characters: NewContentItem[];
  wanted_characters: NewContentItem[];
  lore_articles: NewContentItem[];
}

interface DashboardCharacter {
  id: number;
  name: string;
  avatar: string | null;
}

interface DashboardEpisode {
  id: number;
  topic_id: number;
  name: string;
  subforum_name: string;
  image_url: string | null;
  last_post_date: string;
  post_count: number;
  characters: DashboardCharacter[];
  my_turn: boolean;
}

interface DashboardTopic {
  topic_id: number;
  topic_name: string;
  subforum_name: string;
  last_post_date: string;
  last_post_by: string;
  post_count: number;
}

interface BookmarkedEpisode {
  topic_id: number;
  name: string;
  image_url: string | null;
  characters: string[];
  has_new_posts: boolean;
  new_post_count: number;
}

@Component({
  selector: 'app-user-dashboard',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css',
})
export class UserDashboardComponent {
  activeTab = signal<'game' | 'world' | 'forum'>('game');

  chronicle: WeeklyChronicle = {
    date_from: '2026-09-21',
    date_to: '2026-09-27',
    text: `The week began with unexpected turbulence in the Northern Reaches, as Captain Renn's company discovered the old watchtower at Aldenmoor had been occupied by strangers bearing no house markings. Elara Moonwhisper, crossing through the region on her way south, became entangled in the affair — her encounter with the tower's keeper will likely leave a mark on both of them.

Meanwhile, in the Capital, the threads of A Debt in Silver grew tighter. Lord Halvard called in a favour long owed, and the mysterious figure known only as the Stranger made their first move. Serafine Vance, far away in the Southern Ports, received a letter that can only be connected to these events.

The Ember Sea remains restless. Dorian Ashcroft has gone quiet, and no one seems to know why.`,
  };

  wantedCharacterIdeas: WantedCharacterIdea[] = [
    {
      topic_id: 301,
      name: 'An alchemist who fled the Academy under strange circumstances',
      author_username: 'Thornwick',
      date_created: '2026-09-30T10:00:00',
      faction_name: 'The Academy',
    },
    {
      topic_id: 302,
      name: 'The Stranger\'s contact in the Capital — a fence or information broker',
      author_username: 'duskwriter',
      date_created: '2026-09-29T14:30:00',
      faction_name: null,
    },
    {
      topic_id: 303,
      name: 'A sailor who survived the wreck of the Ember Queen',
      author_username: 'silverpen',
      date_created: '2026-09-28T09:15:00',
      faction_name: 'The Southern Ports',
    },
  ];

  newContent: NewContent = {
    characters: [
      { topic_id: 401, name: 'Brother Aldric of the Silent Order' },
      { topic_id: 402, name: 'Mira Duskfall' },
    ],
    wanted_characters: [
      { topic_id: 301, name: 'An alchemist who fled the Academy' },
      { topic_id: 303, name: 'A sailor who survived the wreck of the Ember Queen' },
    ],
    lore_articles: [
      { topic_id: 501, name: 'The Watchtowers of the Northern Reaches' },
      { topic_id: 502, name: 'Trade routes of the Ember Sea' },
    ],
  };

  episodes: DashboardEpisode[] = [
    {
      id: 1,
      topic_id: 101,
      name: 'The Shadow of Aldenmoor',
      subforum_name: 'The Northern Reaches',
      image_url: 'https://picsum.photos/seed/ep1/400/220',
      last_post_date: '2026-09-28T18:42:00',
      post_count: 34,
      characters: [
        { id: 11, name: 'Elara Moonwhisper', avatar: 'https://picsum.photos/seed/char11/40/40' },
        { id: 12, name: 'Captain Renn', avatar: 'https://picsum.photos/seed/char12/40/40' },
      ],
      my_turn: true,
    },
    {
      id: 2,
      topic_id: 102,
      name: 'Letters from the Ember Sea',
      subforum_name: 'The Southern Ports',
      image_url: 'https://picsum.photos/seed/ep2/400/220',
      last_post_date: '2026-09-25T10:15:00',
      post_count: 17,
      characters: [
        { id: 13, name: 'Serafine Vance', avatar: 'https://picsum.photos/seed/char13/40/40' },
        { id: 14, name: 'Dorian Ashcroft', avatar: null },
      ],
      my_turn: false,
    },
    {
      id: 3,
      topic_id: 103,
      name: 'A Debt in Silver',
      subforum_name: 'The Capital',
      image_url: null,
      last_post_date: '2026-09-20T14:00:00',
      post_count: 52,
      characters: [
        { id: 11, name: 'Elara Moonwhisper', avatar: 'https://picsum.photos/seed/char11/40/40' },
        { id: 15, name: 'Lord Halvard', avatar: 'https://picsum.photos/seed/char15/40/40' },
        { id: 16, name: 'The Stranger', avatar: null },
      ],
      my_turn: true,
    },
    {
      id: 4,
      topic_id: 104,
      name: 'Where the Fog Remembers',
      subforum_name: 'The Northern Reaches',
      image_url: 'https://picsum.photos/seed/ep4/400/220',
      last_post_date: '2026-09-18T09:30:00',
      post_count: 8,
      characters: [
        { id: 13, name: 'Serafine Vance', avatar: 'https://picsum.photos/seed/char13/40/40' },
      ],
      my_turn: false,
    },
  ];

  activeTopics: DashboardTopic[] = [
    { topic_id: 201, topic_name: 'The Great Harvest Festival — planning thread', subforum_name: 'OOC & Planning', last_post_date: '2026-09-30T09:45:00', last_post_by: 'Thornwick', post_count: 38 },
    { topic_id: 202, topic_name: 'OOC: Northern Reaches lore questions', subforum_name: 'OOC & Planning', last_post_date: '2026-09-27T19:20:00', last_post_by: 'silverpen', post_count: 12 },
    { topic_id: 205, topic_name: 'Plotting thread: autumn arc', subforum_name: 'OOC & Planning', last_post_date: '2026-09-22T08:45:00', last_post_by: 'duskwriter', post_count: 21 },
    { topic_id: 210, topic_name: 'Introduce yourself!', subforum_name: 'General', last_post_date: '2026-09-15T14:10:00', last_post_by: 'newcomer99', post_count: 104 },
  ];

  bookmarkedEpisodes: BookmarkedEpisode[] = [
    {
      topic_id: 105,
      name: 'The Cartographer\'s Confession',
      image_url: 'https://picsum.photos/seed/ep5/80/80',
      characters: ['Brother Aldric', 'Mira Duskfall'],
      has_new_posts: true,
      new_post_count: 3,
    },
    {
      topic_id: 106,
      name: 'All Roads Lead to Ash',
      image_url: 'https://picsum.photos/seed/ep6/80/80',
      characters: ['Serafine Vance', 'The Stranger'],
      has_new_posts: true,
      new_post_count: 1,
    },
    {
      topic_id: 107,
      name: 'A Night in the Copper Bell',
      image_url: null,
      characters: ['Captain Renn', 'Dorian Ashcroft', 'Elara Moonwhisper'],
      has_new_posts: false,
      new_post_count: 0,
    },
  ];
}
