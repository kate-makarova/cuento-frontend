import { Component, computed, inject, OnInit, signal, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { InventoryService } from '../services/inventory.service';
import { ArcService } from '../services/arc.service';
import { BoardService } from '../services/board.service';
import { InventoryItemRequest } from '../models/Inventory';
import { SaveButtonComponent, SaveState } from '../admin/save-button/save-button.component';
import { CroppedImageFieldComponent } from '../components/cropped-image-field/cropped-image-field.component';
import { BreadcrumbItem, BreadcrumbsComponent } from '../components/breadcrumbs/breadcrumbs.component';

export const INVENTORY_ICON_SIZE = 150;

@Component({
  selector: 'app-inventory-item-form',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule, RouterLink, SaveButtonComponent, CroppedImageFieldComponent, BreadcrumbsComponent],
  templateUrl: './inventory-item-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: '../npc-form/npc-form.component.css',
})
export class InventoryItemFormComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private arcService = inject(ArcService);
  private boardService = inject(BoardService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('croppedImageRef') croppedImageRef?: CroppedImageFieldComponent;

  readonly canUpload = computed(() => this.boardService.board().use_image_uploading === 'y');
  readonly iconSize = INVENTORY_ICON_SIZE;

  itemId = signal<number | null>(null);
  arcId = signal<number | null>(null);
  saveState = signal<SaveState>('idle');
  loading = signal(true);
  errorMessage = signal('');
  breadcrumbs = signal<BreadcrumbItem[]>([]);

  name = '';
  description = '';
  iconUrl = '';
  isHidden = false;
  displayOrder = 0;

  private readonly homeCrumb: BreadcrumbItem = { label: $localize`:@@common.home:Home`, link: '/' };
  private readonly arcListCrumb: BreadcrumbItem = { label: $localize`:@@npcform.breadcrumbArcList:Story Arcs`, link: '/arc-list' };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.itemId.set(id);
      this.inventoryService.getItem(id).subscribe({
        next: (item) => {
          this.name = item.name;
          this.description = item.description ?? '';
          this.iconUrl = item.icon ?? '';
          this.isHidden = item.is_hidden;
          this.displayOrder = item.display_order;
          this.arcId.set(item.arc_id);
          this.loadArcCrumbs(item.arc_id, [
            { label: item.name, link: `/inventory-item/${item.id}` },
            { label: $localize`:@@inventoryform.breadcrumbEdit:Edit item` },
          ]);
        },
        error: () => this.router.navigate(['/arc-list']),
      });
      return;
    }

    const arcId = Number(this.route.snapshot.queryParamMap.get('arc_id'));
    if (!arcId) { this.router.navigate(['/arc-list']); return; }
    this.arcId.set(arcId);
    this.loadArcCrumbs(arcId, [{ label: $localize`:@@inventoryform.breadcrumbCreate:Add item` }]);
  }

  private loadArcCrumbs(arcId: number, tail: BreadcrumbItem[]): void {
    this.arcService.getArc(arcId).subscribe({
      next: (arc) => {
        this.breadcrumbs.set([this.homeCrumb, this.arcListCrumb, { label: arc.title, link: `/arc/${arc.id}` }, ...tail]);
        this.loading.set(false);
      },
      error: () => {
        this.breadcrumbs.set([this.homeCrumb, this.arcListCrumb, ...tail]);
        this.loading.set(false);
      },
    });
  }

  private request(): InventoryItemRequest {
    const icon = this.canUpload() ? this.croppedImageRef?.value : this.iconUrl.trim();
    return {
      name: this.name.trim(),
      description: this.description.trim(),
      icon: icon || '',
      is_hidden: this.isHidden,
      display_order: this.displayOrder,
    };
  }

  submit(): void {
    if (this.saveState() === 'loading') return;
    if (!this.name.trim()) {
      this.errorMessage.set($localize`:@@inventoryform.nameRequired:Enter a name.`);
      return;
    }
    this.saveState.set('loading');
    this.errorMessage.set('');

    const itemId = this.itemId();
    const done = (id: number) => {
      this.saveState.set('success');
      this.router.navigate(['/inventory-item', id]);
    };
    const failed = () => {
      this.saveState.set('error');
      this.errorMessage.set($localize`:@@inventoryform.saveError:Failed to save the item.`);
    };

    if (itemId) {
      this.inventoryService.updateItem(itemId, this.request()).subscribe({ next: () => done(itemId), error: failed });
    } else {
      this.inventoryService.createItem(this.arcId()!, this.request()).subscribe({ next: (res) => done(res.id), error: failed });
    }
  }

  deleteItem(): void {
    const itemId = this.itemId();
    if (!itemId || !confirm($localize`:@@inventoryform.deleteConfirm:Delete this item?`)) return;
    this.inventoryService.deleteItem(itemId).subscribe({
      next: () => this.router.navigate(['/arc', this.arcId()]),
      error: (err: HttpErrorResponse) => this.errorMessage.set(err.status === 409
        ? $localize`:@@inventoryform.deleteInUse:This item is in a locked inventory and can't be deleted. Hide it instead.`
        : $localize`:@@inventoryform.deleteError:Failed to delete the item.`),
    });
  }
}
