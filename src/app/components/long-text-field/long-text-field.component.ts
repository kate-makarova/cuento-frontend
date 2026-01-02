import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-long-text-field',
  imports: [],
  templateUrl: './long-text-field.component.html',
  styleUrl: './long-text-field.component.css'
})
export class LongTextFieldComponent {
  @Input() fieldName: string | undefined;
  @Input() fieldValue: string | undefined;
  @Input() showFieldName: boolean = true;
}
