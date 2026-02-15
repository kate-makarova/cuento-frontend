import {UserShort} from './UserShort';
import {Field} from './Field';

export interface Character {
  id: number;
  name: string;
  image: string;
  status: string;
  createdAt: string;
  user: UserShort;
  group: string|null;
  subgroup: string|null;
  subsubgroup: string|null;
  customFields: Field[];
}
