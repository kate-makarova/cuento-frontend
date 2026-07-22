import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FieldTemplate } from '../../models/FieldTemplate';

export interface FieldTemplateForm extends FieldTemplate {
  id?: number;
}

@Component({
  selector: 'app-field-template-row',
  imports: [FormsModule],
  templateUrl: './field-template-row.component.html',
  styleUrl: './field-template-row.component.css',
  standalone: true
})
export class FieldTemplateRowComponent {
  @Input() field!: FieldTemplateForm;
  @Input() index!: number;
  @Output() remove = new EventEmitter<void>();

  fieldTypes = ['string', 'text', 'int', 'decimal', 'date', 'free_format_date', 'select'];
  contentFieldTypes = ['short_text', 'number', 'decimal', 'long_text', 'image', 'cropped_image', 'free_format_date'];
  selectContentFieldTypes = ['dropdown', 'radiobox'];

  get availableContentFieldTypes(): string[] {
    return this.field.field_type === 'select' ? this.selectContentFieldTypes : this.contentFieldTypes;
  }

  get selectOptionsEntries(): { id: string; label: string }[] {
    return Object.entries(this.field.options ?? {})
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([id, label]) => ({ id, label }));
  }

  onFieldTypeChange() {
    if (this.field.field_type === 'select') {
      this.field.content_field_type = 'dropdown';
      if (!this.field.options) this.field.options = {};
    }
  }

  addOption() {
    const keys = Object.keys(this.field.options ?? {}).map(Number);
    const nextId = keys.length > 0 ? Math.max(...keys) + 1 : 1;
    this.field.options = { ...(this.field.options ?? {}), [nextId]: '' };
  }

  removeOption(id: string) {
    const opts = { ...this.field.options };
    delete opts[id];
    this.field.options = opts;
  }

  updateOptionLabel(id: string, label: string) {
    this.field.options = { ...(this.field.options ?? {}), [id]: label };
  }
}
