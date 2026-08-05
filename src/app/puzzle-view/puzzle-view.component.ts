import { Component, inject, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PuzzleService } from '../services/puzzle.service';
import { ImageService } from '../services/image.service';
import { AuthService } from '../services/auth.service';
import { BoardService } from '../services/board.service';
import { Puzzle } from '../models/Puzzle';

@Component({
  selector: 'app-puzzle-view',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './puzzle-view.component.html',
})
export class PuzzleViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private puzzleService = inject(PuzzleService);
  private imageService = inject(ImageService);
  private sanitizer = inject(DomSanitizer);
  authService = inject(AuthService);
  boardService = inject(BoardService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  puzzle: Puzzle | null = null;
  safeUrl: SafeResourceUrl | null = null;
  achievementState: 'idle' | 'uploading' | 'success' | 'error' = 'idle';

  get canSaveAchievement(): boolean {
    return this.authService.isAuthenticated() && this.boardService.board().use_image_uploading === 'y';
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.puzzleService.get(id).subscribe({
      next: (p) => {
        this.puzzle = p;
        this.safeUrl = this.extractSafeUrl(p.iframe_code);
      },
      error: (err) => console.error('Failed to load puzzle', err),
    });
  }

  private extractSafeUrl(iframeCode: string): SafeResourceUrl | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(iframeCode, 'text/html');
    const iframe = doc.querySelector('iframe');
    if (!iframe) return null;
    const src = iframe.getAttribute('src') ?? '';
    if (!src || /^javascript:/i.test(src)) return null;
    if (!/^https?:\/\//i.test(src)) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(src);
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.puzzle) return;

    this.achievementState = 'uploading';
    this.imageService.upload(file).subscribe({
      next: (res) => {
        this.puzzleService.saveAchievement(this.puzzle!.id, res.url).subscribe({
          next: () => {
            this.achievementState = 'success';
            setTimeout(() => (this.achievementState = 'idle'), 3000);
          },
          error: () => {
            this.achievementState = 'error';
            setTimeout(() => (this.achievementState = 'idle'), 3000);
          },
        });
      },
      error: () => {
        this.achievementState = 'error';
        setTimeout(() => (this.achievementState = 'idle'), 3000);
      },
    });
    input.value = '';
  }
}
