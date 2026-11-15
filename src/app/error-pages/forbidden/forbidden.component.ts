import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-forbidden',
  host: { class: 'pun-page' },
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './forbidden.component.html',
})
export class ForbiddenComponent {}
