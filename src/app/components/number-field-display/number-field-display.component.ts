import {Component, Input, ChangeDetectionStrategy} from '@angular/core';

@Component({
  selector: 'app-number-field-display',
  imports: [],
  templateUrl: './number-field-display.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class NumberFieldDisplayComponent {
  @Input() fieldMachineName: string | undefined;
  @Input() fieldId?: string;
  @Input() fieldName: string | undefined;
  @Input() fieldValue: number | null = null;
  @Input() showFieldName: boolean = true;
}
