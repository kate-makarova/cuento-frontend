import {Component, inject, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {BoardService} from '../services/board.service';
import {CategoryService} from '../services/category.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  imports: [
    RouterLink
  ]
})
export class HomeComponent implements OnInit {
  boardService = inject(BoardService);
  categoryService = inject(CategoryService);
  board = this.boardService.board;

  ngOnInit() {
    this.boardService.loadBoard();
    this.categoryService.loadHomeCategories();
  }
}
