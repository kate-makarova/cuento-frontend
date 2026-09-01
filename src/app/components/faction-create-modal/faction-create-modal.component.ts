import { Component, EventEmitter, Input, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-faction-create-modal',
  standalone: true,
  imports: [ FormsModule],
  templateUrl: './faction-create-modal.component.html',
})
export class FactionCreateModalComponent {
  @Input() parentId: number | null = null;
  @Input() factionLabel: string = 'Faction';
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<any>();

  name: string = '';
  description: string = '';
  icon: string = '';

  onSubmit() {
    if (!this.name) return;

    const factionData = {
      name: this.name,
      parent_id: this.parentId,
      description: this.description,
      icon: this.icon,
      // Temporary ID for frontend tracking
      id: -Date.now()
    };

    this.created.emit(factionData);
    this.close.emit();
  }

  onCancel() {
    this.close.emit();
  }
}
