import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { InventoryAction, InventoryEntry, InventoryRecipient } from '../../models/Inventory';
import { InventoryListComponent } from '../inventory-list/inventory-list.component';
import { InventoryActionPickerComponent } from '../inventory-action-picker/inventory-action-picker.component';

export interface InventoryModalSection {
  name: string;
  items: InventoryEntry[];
  // set when the player can drop or give from this inventory in the post they are writing
  actionable?: boolean;
}

@Component({
  selector: 'app-inventory-modal',
  standalone: true,
  imports: [InventoryListComponent, InventoryActionPickerComponent],
  templateUrl: './inventory-modal.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './inventory-modal.component.css',
})
export class InventoryModalComponent {
  // null while loading
  @Input() sections: InventoryModalSection[] | null = null;
  @Input() errorMessage = '';
  @Input() emptyMessage = '';
  @Input() recipients: InventoryRecipient[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<InventoryAction>();
}
