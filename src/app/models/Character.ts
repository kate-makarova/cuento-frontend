import {User} from './User';

export class Character {
  id: number;
  name: string;
  image: string;
  race: string;
  status: string;
  bio: string;
  createdAt: string;
  user: User;

  constructor(id: number, name: string, image: string,
              race: string, status: string, bio: string,
              createdAt: string, user: User) {
    this.id = id;
    this.name = name;
    this.image = image;
    this.race = race;
    this.status = status;
    this.bio = bio;
    this.createdAt = createdAt;
    this.user = user;
  }
}
