import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-short-text-field',
  imports: [],
  templateUrl: './short-text-field.component.html',
  standalone: true,
  styleUrl: './short-text-field.component.css'
})
export class ShortTextFieldComponent {
  @Input() fieldName: string | undefined;
  @Input() fieldValue: string | undefined;
  @Input() showFieldName: boolean = true;
  @Input() name: string | undefined;
}
