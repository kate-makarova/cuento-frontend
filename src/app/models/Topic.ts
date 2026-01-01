import {Post} from './Post';

export class Topic {
  id: number;
  name: string;
  forumId: number;
  createdAt: string;
  lastPostDate: string;
  postNumber: number = 0;
  lastPostAuthorUser: string|null = null;
  lastPostAuthorCharacter: string|null = null;
  mode: 'character_only' | 'user_only' | 'any' = 'any';
  type: 'standard' | 'episode' = 'standard';
  defaultCharacterId: number|null = null;
  posts: Post[] = [];


  constructor(id: number, name: string, forumId: number,
              createdAt: string, lastPostDate: string) {
    this.id = id;
    this.name = name;
    this.forumId = forumId;
    this.createdAt = createdAt;
    this.lastPostDate = lastPostDate;
  }
}
