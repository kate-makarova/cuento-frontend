import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InventoryService } from '../services/inventory.service';
import { ArcService } from '../services/arc.service';
import { InventoryItem } from '../models/Inventory';
import { BreadcrumbItem, BreadcrumbsComponent } from '../components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-inventory-item-detail',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink, BreadcrumbsComponent],
  templateUrl: './inventory-item-detail.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: '../npc-detail/npc-detail.component.css',
})
export class InventoryItemDetailComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private arcService = inject(ArcService);
  private route = inject(ActivatedRoute);

  item = signal<InventoryItem | null>(null);
  breadcrumbs = signal<BreadcrumbItem[]>([]);
  loading = signal(true);
  error = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error.set(true); this.loading.set(false); return; }

    this.inventoryService.getItem(id).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
        this.arcService.getArc(item.arc_id).subscribe({
          next: (arc) => this.breadcrumbs.set([
            { label: $localize`:@@common.home:Home`, link: '/' },
            { label: $localize`:@@npcdetail.breadcrumbArcList:Story Arcs`, link: '/arc-list' },
            { label: arc.title, link: `/arc/${arc.id}` },
            { label: item.name },
          ]),
        });
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
