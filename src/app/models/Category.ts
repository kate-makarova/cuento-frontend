import {Subforum} from './Subforum';

export class Category {
  id: number;
  name: string;
  position: number;
  subforums: Subforum[];

  constructor(id: number, name: string, position: number, subforums: Subforum[]) {
    this.id = id;
    this.name = name;
    this.position = position;
    this.subforums = subforums;
  }
}
