import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-field.component.html'
})
export class SelectFieldComponent {
  @Input() fieldName: string = '';
  @Input() name: string = '';
  @Input() fieldValue: any = '';
  @Input() contentFieldType: string = 'dropdown';
  @Input() selectOptions: Record<string, string> = {};

  get optionEntries(): { id: string; label: string }[] {
    return Object.entries(this.selectOptions)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([id, label]) => ({ id, label }));
  }

  isSelected(id: string): boolean {
    if (this.fieldValue == null) return false;
    const val = typeof this.fieldValue === 'object' ? this.fieldValue.id : this.fieldValue;
    return String(val) === id;
  }
}
