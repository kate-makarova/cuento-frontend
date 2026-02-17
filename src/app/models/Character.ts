import {UserShort} from './UserShort';
import {Field} from './Field';
import {FieldTemplate} from './FieldTemplate';

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

export interface CustomFieldsData {
  custom_fields: { [key: string]: any };
  field_config: FieldTemplate[];
}

export interface CharacterProfile {
  id: number;
  character_id: number;
  character_name: string;
  avatar: string;
  custom_fields: CustomFieldsData;
}
