import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PuzzleService } from '../services/puzzle.service';
import { Puzzle, PuzzleAchievement } from '../models/Puzzle';

@Component({
  selector: 'app-puzzle-achievements',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './puzzle-achievements.component.html',
})
export class PuzzleAchievementsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private puzzleService = inject(PuzzleService);

  puzzle: Puzzle | null = null;
  achievements: PuzzleAchievement[] = [];
  loading = true;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.puzzleService.get(id).subscribe({
      next: (p) => (this.puzzle = p),
      error: (err) => console.error('Failed to load puzzle', err),
    });
    this.puzzleService.getAchievements(id).subscribe({
      next: (data) => {
        this.achievements = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load achievements', err);
        this.loading = false;
      },
    });
  }
}
