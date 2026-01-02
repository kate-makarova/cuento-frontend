import { Injectable, signal } from '@angular/core';
import {Board} from '../models/Board';
import {delay, of} from 'rxjs';


@Injectable({ providedIn: 'root' })
export class BoardService {
  private boardSignal = signal<Board>(new Board('', '', 0));
  readonly board = this.boardSignal.asReadonly();

  loadBoard()
  {
    const data: Board = new Board(
      'Crosswind', 'crosswind.net', 1
    );
    of(data).pipe(delay(500)).subscribe(data => {
      this.boardSignal.set(data);
    });
  }
}
