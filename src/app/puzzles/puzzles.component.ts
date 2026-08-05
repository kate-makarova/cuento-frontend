import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleService } from '../services/puzzle.service';
import { Puzzle } from '../models/Puzzle';

@Component({
  selector: 'app-puzzles',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './puzzles.component.html',
})
export class PuzzlesComponent implements OnInit {
  private puzzleService = inject(PuzzleService);

  puzzles: Puzzle[] = [];
  loading = true;

  ngOnInit() {
    this.puzzleService.list().subscribe({
      next: (data) => {
        this.puzzles = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load puzzles', err);
        this.loading = false;
      },
    });
  }
}
