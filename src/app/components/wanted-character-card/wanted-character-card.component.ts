import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { WantedCharacter } from '../../models/WantedCharacter';
import { CustomFieldsData, CustomFieldValue } from '../../models/Character';
import { FieldTemplate } from '../../models/FieldTemplate';
import { FieldDisplayComponent } from '../field-display/field-display.component';
import { UserInfoComponent } from '../user-info/user-info.component';

export interface WantedCharacterCardField {
  fieldMachineName: string;
  fieldName: string;
  fieldValue: any;
  type: string;
  order: number;
}

@Component({
  selector: 'app-wanted-character-card',
  standalone: true,
  imports: [RouterLink, CommonModule, DatePipe, FieldDisplayComponent, UserInfoComponent],
  templateUrl: './wanted-character-card.component.html',
})
export class WantedCharacterCardComponent implements OnChanges {
  @Input() wantedCharacter!: WantedCharacter;
  @Input() expanded = false;
  @Input() canRevoke = false;
  @Input() isAuthenticated = false;

  @Output() expand = new EventEmitter<void>();
  @Output() collapse = new EventEmitter<void>();
  @Output() claim = new EventEmitter<void>();
  @Output() revoke = new EventEmitter<void>();

  fields: WantedCharacterCardField[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['wantedCharacter']) {
      this.fields = this.processFields(this.wantedCharacter?.custom_fields);
    }
  }

  get factionsString(): string {
    return (this.wantedCharacter?.factions ?? []).map(f => f.name).join(', ');
  }

  getField(machineName: string): WantedCharacterCardField | undefined {
    return this.fields.find(f => f.fieldMachineName === machineName);
  }

  private processFields(data: CustomFieldsData): WantedCharacterCardField[] {
    if (!data?.field_config) return [];

    return data.field_config
      .map((config: FieldTemplate) => {
        const customField: CustomFieldValue | undefined = data.custom_fields?.[config.machine_field_name];
        let fieldValue: any = '';

        if (customField) {
          let content = customField.content;
          if (config.content_field_type === 'dropdown' || config.content_field_type === 'radiobox') {
            fieldValue = content?.value ?? '';
          } else {
            if (content !== null && content !== undefined && typeof content === 'object') {
              content = 'content' in content ? (content as any).content : '';
            }
            fieldValue = config.content_field_type === 'long_text'
              ? (customField.content_html || (content != null ? String(content) : ''))
              : content;
          }
        }

        return {
          fieldMachineName: config.machine_field_name,
          fieldName: config.human_field_name,
          fieldValue: fieldValue ?? '',
          type: config.content_field_type,
          order: config.order,
        };
      })
      .sort((a, b) => a.order - b.order);
  }
}
