import { Component, computed, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { concatMap } from 'rxjs';
import { InventoryService } from '../services/inventory.service';
import { InventoryQuantity, SceneInventories } from '../models/Inventory';
import { EpisodeStatus } from '../models/Episode';
import { InventoryListComponent } from '../components/inventory-list/inventory-list.component';
import { BreadcrumbItem, BreadcrumbsComponent } from '../components/breadcrumbs/breadcrumbs.component';

export interface DraftRow {
  item_id: number | null;
  quantity: number;
}

@Component({
  selector: 'app-scene-inventory',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink, InventoryListComponent, BreadcrumbsComponent],
  templateUrl: './scene-inventory.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './scene-inventory.component.css',
})
export class SceneInventoryComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  episodeId = 0;
  scene = signal<SceneInventories | null>(null);
  loadError = signal(false);
  drafts = signal<Record<number, DraftRow[]>>({});
  busyProfileId = signal<number | null>(null);
  profileErrors = signal<Record<number, string>>({});
  startError = signal('');
  starting = signal(false);
  breadcrumbs = signal<BreadcrumbItem[]>([]);

  readonly isPending = computed(() => this.scene()?.status === EpisodeStatus.Pending);
  readonly allLocked = computed(() => (this.scene()?.inventories ?? []).every(inv => inv.is_locked));

  ngOnInit(): void {
    this.episodeId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.episodeId) { this.router.navigate(['/']); return; }
    this.load();
  }

  load(): void {
    this.inventoryService.getSceneInventories(this.episodeId).subscribe({
      next: (scene) => {
        this.scene.set(scene);
        const drafts: Record<number, DraftRow[]> = {};
        for (const inv of scene.inventories) {
          drafts[inv.profile_id] = inv.items.map(e => ({ item_id: e.item_id, quantity: e.quantity }));
        }
        this.drafts.set(drafts);
        this.breadcrumbs.set([
          { label: $localize`:@@common.home:Home`, link: '/' },
          { label: scene.name, link: `/viewtopic/${scene.topic_id}` },
          { label: $localize`:@@sceneinventory.breadcrumb:Inventories` },
        ]);
      },
      error: () => this.loadError.set(true),
    });
  }

  rows(profileId: number): DraftRow[] {
    return this.drafts()[profileId] ?? [];
  }

  private updateRows(profileId: number, change: (rows: DraftRow[]) => DraftRow[]): void {
    this.drafts.update(d => ({ ...d, [profileId]: change(d[profileId] ?? []) }));
  }

  addRow(profileId: number): void {
    this.updateRows(profileId, rows => [...rows, { item_id: null, quantity: 1 }]);
  }

  removeRow(profileId: number, index: number): void {
    this.updateRows(profileId, rows => rows.filter((_, i) => i !== index));
  }

  setRowItem(profileId: number, index: number, event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.updateRows(profileId, rows => rows.map((r, i) => i === index ? { ...r, item_id: value || null } : r));
  }

  setRowQuantity(profileId: number, index: number, event: Event): void {
    const value = Math.floor(Number((event.target as HTMLInputElement).value));
    this.updateRows(profileId, rows => rows.map((r, i) => i === index ? { ...r, quantity: value } : r));
  }

  private quantities(profileId: number): InventoryQuantity[] {
    return this.rows(profileId)
      .filter((r): r is { item_id: number; quantity: number } => r.item_id !== null)
      .map(r => ({ item_id: r.item_id, quantity: r.quantity }));
  }

  private setProfileError(profileId: number, message: string): void {
    this.profileErrors.update(e => ({ ...e, [profileId]: message }));
  }

  private profileErrorMessage(err: HttpErrorResponse): string {
    if (err.status === 400) {
      return $localize`:@@sceneinventory.invalidItems:Each item can appear once and needs a quantity of at least 1.`;
    }
    if (err.status === 409) {
      return $localize`:@@sceneinventory.alreadyLocked:This inventory is already locked.`;
    }
    return $localize`:@@sceneinventory.saveError:Failed to save the inventory.`;
  }

  save(profileId: number): void {
    this.busyProfileId.set(profileId);
    this.setProfileError(profileId, '');
    this.inventoryService.saveSceneInventory(this.episodeId, profileId, this.quantities(profileId)).subscribe({
      next: () => { this.busyProfileId.set(null); this.load(); },
      error: (err: HttpErrorResponse) => { this.busyProfileId.set(null); this.setProfileError(profileId, this.profileErrorMessage(err)); },
    });
  }

  // Saves the current rows first, so what the GM sees is exactly what gets locked.
  lock(profileId: number, name: string): void {
    if (!confirm($localize`:@@sceneinventory.lockConfirm:Lock the inventory of ${name}:name:? It can't be edited afterwards.`)) return;
    this.busyProfileId.set(profileId);
    this.setProfileError(profileId, '');
    this.inventoryService.saveSceneInventory(this.episodeId, profileId, this.quantities(profileId)).pipe(
      concatMap(() => this.inventoryService.lockSceneInventory(this.episodeId, profileId)),
    ).subscribe({
      next: () => { this.busyProfileId.set(null); this.load(); },
      error: (err: HttpErrorResponse) => { this.busyProfileId.set(null); this.setProfileError(profileId, this.profileErrorMessage(err)); },
    });
  }

  start(): void {
    this.starting.set(true);
    this.startError.set('');
    this.inventoryService.startScene(this.episodeId).subscribe({
      next: () => this.router.navigate(['/viewtopic', this.scene()!.topic_id]),
      error: (err: HttpErrorResponse) => {
        this.starting.set(false);
        const unlocked: string[] = err.error?.unlocked ?? [];
        this.startError.set(unlocked.length
          ? $localize`:@@sceneinventory.startUnlocked:Lock these inventories first: ${unlocked.join(', ')}:names:`
          : $localize`:@@sceneinventory.startError:Failed to start the scene.`);
      },
    });
  }
}
