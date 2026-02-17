import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Episode } from '../../models/Episode';
import { ShortTextFieldDisplayComponent } from '../short-text-field-display/short-text-field-display.component';
import { LongTextFieldDisplayComponent } from '../long-text-field-display/long-text-field-display.component';
import { CustomFieldsData } from '../../models/Character';

@Component({
  selector: 'app-episode-header',
  imports: [CommonModule, ShortTextFieldDisplayComponent, LongTextFieldDisplayComponent],
  templateUrl: './episode-header.component.html',
  standalone: true,
  styleUrl: './episode-header.component.css'
})
export class EpisodeHeaderComponent implements OnInit {
  @Input() episode!: Episode;
  customFields: any[] = [];

  ngOnInit() {
    if (this.episode && this.episode.custom_fields) {
      this.customFields = this.processCustomFields(this.episode.custom_fields);
    }
  }

  private processCustomFields(data: CustomFieldsData): any[] {
    if (!data || !data.field_config) return [];

    return data.field_config.map(config => {
      return {
        fieldMachineName: config.machine_field_name,
        fieldName: config.human_field_name,
        fieldValue: data.custom_fields ? data.custom_fields[config.machine_field_name] : null,
        type: config.content_field_type,
        showFieldName: true,
        order: config.order
      };
    }).sort((a, b) => a.order - b.order);
  }
}
