import {Topic} from './Topic';
import {CharacterShort} from './CharacterShort';

export class Episode extends Topic{
 summary: string;
 characters: CharacterShort[];
 image: string|null;
  constructor(id: number, name: string, forumId: number,
              createdAt: string, lastPostDate: string,
              characters: CharacterShort[], summary: string, image: string|null) {
   super(id, name, forumId, createdAt, lastPostDate);
   this.mode = "character_only";
   this.type = 'episode';
   this.image = image;
   this.characters = characters;
   this.summary = summary;
  }
}
