import {UserShort} from './UserShort';
import {Field} from './Field';

export interface Character {
  id: number;
  name: string;
  image: string;
  character_status: number;
  createdAt: string;
  user: UserShort;
  group: string|null;
  subgroup: string|null;
  subsubgroup: string|null;
  customFields: Field[];
}
