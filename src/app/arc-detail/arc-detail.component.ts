import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ArcService } from '../services/arc.service';
import { AuthService } from '../services/auth.service';
import { ArcEpisode, ArcNpc, ArcStatus, StoryArc } from '../models/StoryArc';

@Component({
  selector: 'app-arc-detail',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './arc-detail.component.html',
  styleUrl: './arc-detail.component.css',
})
export class ArcDetailComponent implements OnInit {
  private arcService = inject(ArcService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  arc = signal<StoryArc | null>(null);
  episodes = signal<ArcEpisode[]>([]);
  npcs = signal<ArcNpc[]>([]);
  loading = signal(true);

  readonly ArcStatus = ArcStatus;

  readonly statusLabels: Record<number, string> = {
    [ArcStatus.Pending]:  $localize`:@@arcdetail.statusPending:Pending`,
    [ArcStatus.Active]:   $localize`:@@arcdetail.statusActive:Active`,
    [ArcStatus.Archived]: $localize`:@@arcdetail.statusArchived:Archived`,
    [ArcStatus.Finished]: $localize`:@@arcdetail.statusFinished:Finished`,
  };

  readonly episodeStatusLabels: Record<number, string> = {
    0: $localize`:@@arcdetail.episodeActive:In Progress`,
    1: $localize`:@@arcdetail.episodeInactive:Completed`,
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/arc-list']); return; }

    forkJoin({
      arc: this.arcService.getArc(id),
      episodes: this.arcService.getArcEpisodes(id),
      npcs: this.arcService.getArcNpcs(id, 5),
    }).subscribe({
      next: ({ arc, episodes, npcs }) => {
        this.arc.set(arc);
        this.episodes.set(episodes);
        this.npcs.set(npcs);
        this.loading.set(false);
      },
      error: () => this.router.navigate(['/arc-list']),
    });
  }

  canEdit(): boolean {
    return this.arc()?.can_edit ?? false;
  }
}
