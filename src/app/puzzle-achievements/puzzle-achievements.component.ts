import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PuzzleService } from '../services/puzzle.service';
import { PuzzleAchievement } from '../models/Puzzle';

@Component({
  selector: 'app-puzzle-achievements',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './puzzle-achievements.component.html',
})
export class PuzzleAchievementsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private puzzleService = inject(PuzzleService);

  achievements: PuzzleAchievement[] = [];
  loading = true;

  ngOnInit() {
    const userId = Number(this.route.snapshot.paramMap.get('id'));
    this.puzzleService.getUserAchievements(userId).subscribe({
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
