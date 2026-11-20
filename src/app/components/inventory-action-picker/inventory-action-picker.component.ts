import { Component, ChangeDetectionStrategy, computed, input, output, signal } from '@angular/core';
import { InventoryAction, InventoryEntry, InventoryRecipient } from '../../models/Inventory';

// Lets a player pick items from their current inventory and drop them or give them to someone in the scene.
@Component({
  selector: 'app-inventory-action-picker',
  standalone: true,
  templateUrl: './inventory-action-picker.component.html',
  styleUrls: ['../inventory-list/inventory-list.component.css', './inventory-action-picker.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class InventoryActionPickerComponent {
  readonly items = input<InventoryEntry[]>([]);
  readonly recipients = input<InventoryRecipient[]>([]);
  readonly act = output<InventoryAction>();

  // item id → chosen quantity; an item is selected while it has an entry
  readonly chosen = signal<Record<number, number>>({});
  readonly recipientId = signal<number | null>(null);

  readonly itemsArg = computed(() => {
    const chosen = this.chosen();
    return this.items()
      .filter(e => chosen[e.item_id] !== undefined)
      .map(e => `${e.item_id}:${chosen[e.item_id]}`)
      .join(',');
  });
  readonly canGive = computed(() => this.itemsArg() !== '' && this.recipientId() !== null);

  toggle(entry: InventoryEntry, checked: boolean): void {
    this.chosen.update(c => {
      const next = { ...c };
      if (checked) next[entry.item_id] = entry.quantity;
      else delete next[entry.item_id];
      return next;
    });
  }

  setQuantity(entry: InventoryEntry, value: string): void {
    const n = Math.min(entry.quantity, Math.max(1, Math.floor(Number(value)) || 1));
    this.chosen.update(c => ({ ...c, [entry.item_id]: n }));
  }

  setRecipient(value: string): void {
    this.recipientId.set(value ? Number(value) : null);
  }

  drop(): void {
    if (this.itemsArg()) this.act.emit({ kind: 'drop', items: this.itemsArg() });
  }

  give(): void {
    const to = this.recipientId();
    if (this.canGive() && to !== null) this.act.emit({ kind: 'give', items: this.itemsArg(), to });
  }
}
