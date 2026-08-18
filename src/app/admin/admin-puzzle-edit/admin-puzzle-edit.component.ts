import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PuzzleService } from '../../services/puzzle.service';
import { Puzzle } from '../../models/Puzzle';
import { SaveButtonComponent, SaveState } from '../save-button/save-button.component';

@Component({
  selector: 'app-admin-puzzle-edit',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule, RouterLink, SaveButtonComponent],
  templateUrl: './admin-puzzle-edit.component.html',
})
export class AdminPuzzleEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private puzzleService = inject(PuzzleService);

  puzzle: Puzzle | null = null;
  isNew = false;

  title = '';
  iframeCode = '';
  isPublic = true;
  isActive = true;

  saveState: SaveState = 'idle';

  ngOnInit() {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === 'new') {
      this.isNew = true;
    } else {
      const id = Number(raw);
      this.puzzleService.adminGet(id).subscribe({
        next: (p) => {
          this.puzzle = p;
          this.title = p.title;
          this.iframeCode = p.iframe_code;
          this.isPublic = p.is_public;
          this.isActive = p.is_active;
        },
        error: (err) => console.error('Failed to load puzzle', err),
      });
    }
  }

  submit() {
    this.saveState = 'loading';
    if (this.isNew) {
      this.puzzleService.create({ title: this.title, iframe_code: this.iframeCode, is_public: this.isPublic, is_active: this.isActive }).subscribe({
        next: (created) => {
          this.saveState = 'success';
          setTimeout(() => {
            this.saveState = 'idle';
            this.router.navigate(['/admin/features/puzzle', created.id]);
          }, 1500);
        },
        error: (err) => {
          console.error('Failed to create puzzle', err);
          this.saveState = 'error';
          setTimeout(() => (this.saveState = 'idle'), 3000);
        },
      });
    } else {
      this.puzzleService.update(this.puzzle!.id, {
        title: this.title,
        iframe_code: this.iframeCode,
        is_public: this.isPublic,
        is_active: this.isActive,
      }).subscribe({
        next: (updated) => {
          this.puzzle = updated;
          this.saveState = 'success';
          setTimeout(() => (this.saveState = 'idle'), 3000);
        },
        error: (err) => {
          console.error('Failed to save puzzle', err);
          this.saveState = 'error';
          setTimeout(() => (this.saveState = 'idle'), 3000);
        },
      });
    }
  }
}
