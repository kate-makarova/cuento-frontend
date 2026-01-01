import {Component, inject, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {BoardService} from '../services/board.service';
import {CategoryService} from '../services/category.service';
import {Category} from '../models/Category';
import {delay, of} from 'rxjs';

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

  ngOnInit() {
    this.categoryService.loadHomeCategories();
  }
}
