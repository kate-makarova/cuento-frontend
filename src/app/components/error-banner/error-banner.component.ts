import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (message) {
      <div class="alert alert-error">{{ message }}</div>
    }
  `,
})
export class ErrorBannerComponent {
  @Input() message: string | null = null;
}
