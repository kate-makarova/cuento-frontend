import {Category} from './Category';

export class Subforum {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  position: number;
  canReadRoles: string[];
  canWriteRoles: string[];
  topicNumber: number = 0;
  postNumber: number = 0;
  isGameSubforum: boolean = false;

  constructor(id: number, name: string, description: string, categoryId: number, position: number) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.categoryId = categoryId;
    this.position = position;
    this.canReadRoles = [];
    this.canWriteRoles = [];
  }
}
