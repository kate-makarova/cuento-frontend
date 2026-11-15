import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-free-format-date-field-display',
  imports: [],
  templateUrl: './free-format-date-field-display.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class FreeFormatDateFieldDisplayComponent {
  @Input() fieldMachineName: string | undefined;
  @Input() fieldId?: string;
  @Input() fieldName: string | undefined;
  @Input() fieldValue: string | undefined;
  @Input() showFieldName: boolean = true;
}
