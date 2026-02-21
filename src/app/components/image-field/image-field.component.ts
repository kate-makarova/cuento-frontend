import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-image-field',
  imports: [],
  templateUrl: './image-field.component.html',
  standalone: true,
  styleUrl: './image-field.component.css'
})
export class ImageFieldComponent {
  @Input() fieldName: string | undefined;
  @Input() fieldValue: string = '';
  @Input() showFieldName: boolean = true;
  @Input() name: string | undefined;
}
