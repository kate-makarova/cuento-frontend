import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-long-text-field-display',
  imports: [],
  templateUrl: './long-text-field-display.component.html',
  standalone: true,
  styleUrl: './long-text-field-display.component.css'
})
export class LongTextFieldDisplayComponent {
  @Input() fieldMachineName: string | undefined;
  @Input() fieldName: string | undefined;
  @Input() fieldValue: string | undefined;
  @Input() showFieldName: boolean = true;
}
