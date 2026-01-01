import {Category} from './Category';

export class Subforum {
  id: number;
  name: string;
  description: string;
  category: Category;
  position: number;
  canReadRoles: string[];
  canWriteRoles: string[];

  constructor(id: number, name: string, description: string, category: Category, position: number) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.category = category;
    this.position = position;
    this.canReadRoles = [];
    this.canWriteRoles = [];
  }
}
