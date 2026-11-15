import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-image-field-display',
  imports: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './image-field-display.component.html',
})
export class ImageFieldDisplayComponent {
  @Input() fieldName: string | undefined;
  @Input() fieldValue: string | undefined;
  @Input() showFieldName: boolean = true;
}
