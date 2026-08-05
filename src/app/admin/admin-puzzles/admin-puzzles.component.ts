import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleService } from '../../services/puzzle.service';
import { Puzzle } from '../../models/Puzzle';

@Component({
  selector: 'app-admin-puzzles',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-puzzles.component.html',
})
export class AdminPuzzlesComponent implements OnInit {
  private puzzleService = inject(PuzzleService);

  puzzles: Puzzle[] = [];

  ngOnInit() {
    this.puzzleService.list().subscribe({
      next: (data) => (this.puzzles = data),
      error: (err) => console.error('Failed to load puzzles', err),
    });
  }

  delete(puzzle: Puzzle) {
    if (!confirm(`Delete puzzle "${puzzle.title}"?`)) return;
    this.puzzleService.delete(puzzle.id).subscribe({
      next: () => (this.puzzles = this.puzzles.filter(p => p.id !== puzzle.id)),
      error: (err) => console.error('Failed to delete puzzle', err),
    });
  }
}
