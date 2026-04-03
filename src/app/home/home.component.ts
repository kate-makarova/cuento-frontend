import {Component, inject, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {BoardService} from '../services/board.service';
import {CategoryService} from '../services/category.service';
import {CurrentlyActiveComponent} from '../components/currently-active/currently-active.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  imports: [
    RouterLink,
    CurrentlyActiveComponent
  ]
})
export class HomeComponent implements OnInit {
  boardService = inject(BoardService);
  categoryService = inject(CategoryService);
  board = this.boardService.board;
  categories = this.categoryService.homeCategories;

  ngOnInit() {
    this.boardService.loadBoard();
    this.categoryService.loadHomeCategories();
  }
}
