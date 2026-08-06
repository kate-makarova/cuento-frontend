import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PuzzleService } from '../services/puzzle.service';
import { AuthService } from '../services/auth.service';
import { PuzzleAchievement } from '../models/Puzzle';

@Component({
  selector: 'app-puzzle-achievements',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './puzzle-achievements.component.html',
  styleUrl: './puzzle-achievements.component.css',
})
export class PuzzleAchievementsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private puzzleService = inject(PuzzleService);
  authService = inject(AuthService);

  achievements: PuzzleAchievement[] = [];
  loading = true;
  isOwnPage = false;

  ngOnInit() {
    const userId = Number(this.route.snapshot.paramMap.get('id'));
    this.isOwnPage = userId === this.authService.currentUser()?.id;

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

  delete(achievement: PuzzleAchievement) {
    this.puzzleService.deleteAchievement(achievement.id).subscribe({
      next: () => {
        this.achievements = this.achievements.filter(a => a.id !== achievement.id);
      },
      error: (err) => console.error('Failed to delete achievement', err),
    });
  }
}
