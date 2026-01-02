import {Field} from './Field';

export class CharacterProfile {
  id: number;
  name: string;
  image: string;
  customFields: Field[];

  constructor(id: number, name: string, image: string, customFields: Field[]) {
    this.id = id;
    this.name = name;
    this.image = image;
    this.customFields = customFields;
  }
}
