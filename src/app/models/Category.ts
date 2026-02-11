import {Subforum} from './Subforum';

export interface Category {
  id: number;
  name: string;
  position: number;
  subforums: Subforum[];
}
