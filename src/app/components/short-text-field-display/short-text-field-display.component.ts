import {Component, Input, ChangeDetectionStrategy} from '@angular/core';

@Component({
  selector: 'app-short-text-field-display',
  imports: [],
  templateUrl: './short-text-field-display.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class ShortTextFieldDisplayComponent {
  @Input() fieldMachineName: string | undefined;
  @Input() fieldId?: string;
  @Input() fieldName: string | undefined;
  @Input() fieldValue: string | undefined;
  @Input() showFieldName: boolean = true;
}
