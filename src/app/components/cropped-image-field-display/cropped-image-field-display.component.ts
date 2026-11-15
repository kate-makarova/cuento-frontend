import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-cropped-image-field-display',
  imports: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './cropped-image-field-display.component.html',
})
export class CroppedImageFieldDisplayComponent {
  @Input() fieldName: string | undefined;
  @Input() fieldValue: string | undefined;
  @Input() showFieldName: boolean = true;
}
