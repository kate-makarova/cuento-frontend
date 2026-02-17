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

export interface CharacterShort {
  id: number;
  name: string;
  image: string;
}

export interface CharacterProfile {
  id: number;
  name: string;
  avatar: string;
  customFields: Field[];
}
