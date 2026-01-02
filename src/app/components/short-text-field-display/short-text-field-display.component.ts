import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-short-text-field-display',
  imports: [],
  templateUrl: './short-text-field-display.component.html',
  styleUrl: './short-text-field-display.component.css'
})
export class ShortTextFieldDisplayComponent {
  @Input() fieldMachineName: string | undefined;
  @Input() fieldName: string | undefined;
  @Input() fieldValue: string | undefined;
  @Input() showFieldName: boolean = true;
}
