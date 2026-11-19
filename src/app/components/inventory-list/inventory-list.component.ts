import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { InventoryEntry } from '../../models/Inventory';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  templateUrl: './inventory-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './inventory-list.component.css',
})
export class InventoryListComponent {
  @Input() items: InventoryEntry[] = [];
}
