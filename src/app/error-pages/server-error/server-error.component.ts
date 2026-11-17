import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-server-error',
  host: { class: 'pun-page' },
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './server-error.component.html',
})
export class ServerErrorComponent {}
