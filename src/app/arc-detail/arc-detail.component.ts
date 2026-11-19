import { Component, computed, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ArcService } from '../services/arc.service';
import { AuthService } from '../services/auth.service';
import { ArcEpisode, ArcNpc, ArcStatus, StoryArc } from '../models/StoryArc';
import { EpisodeStatus } from '../models/Episode';
import { ArcInventory } from '../models/Inventory';
import { InventoryService } from '../services/inventory.service';
import { BreadcrumbItem, BreadcrumbsComponent } from '../components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-arc-detail',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink, BreadcrumbsComponent],
  templateUrl: './arc-detail.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './arc-detail.component.css',
})
export class ArcDetailComponent implements OnInit {
  private arcService = inject(ArcService);
  private inventoryService = inject(InventoryService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  breadcrumbs = signal<BreadcrumbItem[]>([
    { label: $localize`:@@common.home:Home`, link: '/' },
    { label: $localize`:@@arcdetail.breadcrumbArcList:Story Arcs`, link: '/arc-list' }]);

  arc = signal<StoryArc | null>(null);
  episodes = signal<ArcEpisode[]>([]);
  npcs = signal<ArcNpc[]>([]);
  inventory = signal<ArcInventory | null>(null);
  inventoryError = signal('');
  loading = signal(true);

  readonly showInventory = computed(() => {
    const inv = this.inventory();
    return !!inv && (inv.can_edit || (inv.enabled && inv.items.length > 0));
  });

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
    [EpisodeStatus.Pending]: $localize`:@@episode.statusPending:Pending`,
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/arc-list']); return; }

    forkJoin({
      arc: this.arcService.getArc(id),
      episodes: this.arcService.getArcEpisodes(id),
      npcs: this.arcService.getArcNpcs(id, 11),
      inventory: this.inventoryService.getArcInventory(id),
    }).subscribe({
      next: ({ arc, episodes, npcs, inventory }) => {
        this.arc.set(arc);
        this.episodes.set(episodes);
        this.npcs.set(npcs);
        this.inventory.set(inventory);
        this.breadcrumbs.update(crumbs => [
          ...crumbs,
          { label: arc.title }]);
        this.loading.set(false);
      },
      error: () => this.router.navigate(['/arc-list']),
    });
  }

  canEdit(): boolean {
    return this.arc()?.can_edit ?? false;
  }

  setInventoryEnabled(enabled: boolean): void {
    const arc = this.arc();
    if (!arc) return;
    this.inventoryError.set('');
    this.inventoryService.setArcInventory(arc.id, enabled).subscribe({
      next: () => this.inventory.update(inv => inv && { ...inv, enabled }),
      error: () => this.inventoryError.set(enabled
        ? $localize`:@@arcdetail.inventoryEnableError:Failed to turn inventory on.`
        : $localize`:@@arcdetail.inventoryInUse:Inventory can't be turned off: a scene of this arc already uses it.`),
    });
  }
}
