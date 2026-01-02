import {UserShort} from './UserShort';
import {Field} from './Field';

export class Character {
  id: number;
  name: string;
  image: string;
  status: string;
  createdAt: string;
  user: UserShort;
  group: string|null;
  subgroup: string|null;
  subsubgroup: string|null;
  customFields: Field[] = [];

  constructor(id: number, name: string, image: string, status: string,
              createdAt: string, user: UserShort,
              group: string|null = null, subgroup: string|null = null,
              subsubgroup: string|null = null, customFields: Field[] = []) {
    this.id = id;
    this.name = name;
    this.image = image;
    this.status = status;
    this.createdAt = createdAt;
    this.user = user;
    this.group = group;
    this.subgroup = subgroup;
    this.subsubgroup = subsubgroup;
    this.customFields = customFields;
  }
}
