import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { InventoryEntry } from '../../models/Inventory';
import { InventoryListComponent } from '../inventory-list/inventory-list.component';

export interface InventoryModalSection {
  name: string;
  items: InventoryEntry[];
}

@Component({
  selector: 'app-inventory-modal',
  standalone: true,
  imports: [InventoryListComponent],
  templateUrl: './inventory-modal.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './inventory-modal.component.css',
})
export class InventoryModalComponent {
  // null while loading
  @Input() sections: InventoryModalSection[] | null = null;
  @Input() errorMessage = '';
  @Input() emptyMessage = '';
  @Output() close = new EventEmitter<void>();
}
