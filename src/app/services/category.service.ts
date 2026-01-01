import { Injectable, signal, inject } from '@angular/core';
import {Category} from '../models/Category';
import {delay, of} from 'rxjs';
import {Subforum} from '../models/Subforum';
import {BoardService} from './board.service';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private homeCategoriesSignal = signal<Category[]>([]);
  readonly homeCategories = this.homeCategoriesSignal.asReadonly();
  boardService =  inject(BoardService);


  loadHomeCategories() {
    const board = this.boardService.board;
    const data = [
      new Category(1, 'Guest Book', 1, [
        new Subforum(1, 'Guest Book', 'Guest book', 1, 1)
      ]),
      new Category(2, 'Technical', 2, [
        new Subforum(2, 'Character Sheets', '', 2, 1)
      ]),
      new Category(3, 'Games', 3, [
        new Subforum(3, 'Fandom', '', 3, 1),
        new Subforum(5, 'Crossover', '', 3, 2),
      ]),
      new Category(4, 'Offtopic', 4, [
        new Subforum(4, 'Chat', '', 4, 1)
      ]),
    ];
    of(data).pipe(delay(500)).subscribe(data => {
      this.homeCategoriesSignal.set(data);
    });
  }

}
