import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleService } from '../../services/puzzle.service';
import { Puzzle } from '../../models/Puzzle';

@Component({
  selector: 'app-admin-puzzles',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-puzzles.component.html',
})
export class AdminPuzzlesComponent implements OnInit {
  private puzzleService = inject(PuzzleService);

  puzzles: Puzzle[] = [];

  ngOnInit() {
    this.puzzleService.adminList().subscribe({
      next: (data) => (this.puzzles = data),
      error: (err) => console.error('Failed to load puzzles', err),
    });
  }
}
