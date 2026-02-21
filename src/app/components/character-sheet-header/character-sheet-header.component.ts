import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character } from '../../models/Character';
import { ShortTextFieldDisplayComponent } from '../short-text-field-display/short-text-field-display.component';
import { LongTextFieldDisplayComponent } from '../long-text-field-display/long-text-field-display.component';
import { NumberFieldDisplayComponent } from '../number-field-display/number-field-display.component';
import { CustomFieldsData } from '../../models/Character';

@Component({
  selector: 'app-character-sheet-header',
  imports: [CommonModule, ShortTextFieldDisplayComponent, LongTextFieldDisplayComponent, NumberFieldDisplayComponent],
  templateUrl: './character-sheet-header.component.html',
  standalone: true,
  styleUrl: './character-sheet-header.component.css'
})
export class CharacterSheetHeaderComponent implements OnInit {
  @Input() character!: Character | null;
  customFields: any[] = [];

  ngOnInit() {
    if (this.character && this.character.custom_fields) {
      this.customFields = this.processCustomFields(this.character.custom_fields);
    }
  }

  private processCustomFields(data: CustomFieldsData): any[] {
    if (!data || !data.field_config) return [];

    return data.field_config.map(config => {
      return {
        fieldMachineName: config.machine_field_name,
        fieldName: config.human_field_name,
        fieldValue: (data.custom_fields ? data.custom_fields[config.machine_field_name] : '') ?? '',
        type: config.content_field_type,
        showFieldName: true,
        order: config.order
      };
    }).sort((a, b) => a.order - b.order);
  }
}
