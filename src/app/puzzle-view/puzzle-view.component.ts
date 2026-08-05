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

  @ViewChild('puzzleFrame') puzzleFrame!: ElementRef<HTMLIFrameElement>;

  puzzle: Puzzle | null = null;
  safeUrl: SafeResourceUrl | null = null;
  iframeWidth: string | null = null;
  iframeHeight: string | null = null;
  achievementState: 'idle' | 'uploading' | 'success' | 'error' = 'idle';

  get canSaveAchievement(): boolean {
    return this.authService.isAuthenticated() && this.boardService.board().use_image_uploading === 'y';
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.puzzleService.get(id).subscribe({
      next: (p) => {
        this.puzzle = p;
        this.extractIframeData(p.iframe_code);
      },
      error: (err) => console.error('Failed to load puzzle', err),
    });
  }

  private extractIframeData(iframeCode: string): void {
    const parser = new DOMParser();
    const doc = parser.parseFromString(iframeCode, 'text/html');
    const iframe = doc.querySelector('iframe');
    if (!iframe) return;
    const src = iframe.getAttribute('src') ?? '';
    if (!src || /^javascript:/i.test(src)) return;
    if (!/^https?:\/\//i.test(src)) return;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(src);
    this.iframeWidth = iframe.getAttribute('width');
    this.iframeHeight = iframe.getAttribute('height');
  }

  async saveAchievement() {
    if (!this.puzzle) return;
    this.achievementState = 'uploading';

    try {
      const rect = this.puzzleFrame.nativeElement.getBoundingClientRect();

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        // @ts-ignore preferCurrentTab pre-selects the current tab in supported browsers
        preferCurrentTab: true,
      } as DisplayMediaStreamOptions);

      const blob = await this.captureRegion(stream, rect);
      stream.getTracks().forEach(t => t.stop());

      const file = new File([blob], 'achievement.png', { type: 'image/png' });
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
    } catch (e) {
      console.error('Screenshot failed:', e);
      this.achievementState = 'error';
      setTimeout(() => (this.achievementState = 'idle'), 3000);
    }
  }

  private captureRegion(stream: MediaStream, rect: DOMRect): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.srcObject = stream;

      video.addEventListener('playing', () => {
        const scaleX = video.videoWidth / window.innerWidth;
        const scaleY = video.videoHeight / window.innerHeight;

        const sx = Math.round(rect.left * scaleX);
        const sy = Math.round(rect.top * scaleY);
        const sw = Math.round(rect.width * scaleX);
        const sh = Math.round(rect.height * scaleY);

        // Output at CSS pixel dimensions so the image matches the iframe's logical size
        const outW = Math.round(rect.width);
        const outH = Math.round(rect.height);
        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        canvas.getContext('2d')!.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH);

        canvas.toBlob(
          b => b ? resolve(b) : reject(new Error('toBlob failed')),
          'image/png'
        );
      }, { once: true });

      video.onerror = reject;
      video.play().catch(reject);
    });
  }
}
