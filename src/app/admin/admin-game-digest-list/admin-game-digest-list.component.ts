import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GameDigestService } from '../../services/game-digest.service';
import { GameDigest } from '../../models/GameDigest';

@Component({
  selector: 'app-admin-game-digest-list',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-game-digest-list.component.html',
})
export class AdminGameDigestListComponent implements OnInit {
  private digestService = inject(GameDigestService);

  digests = signal<GameDigest[]>([]);

  ngOnInit() {
    this.digestService.getDigests().subscribe({
      next: data => this.digests.set(data),
      error: err => console.error('Failed to load digests', err)
    });
  }
}
