import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-breadcrumbs',
  imports: [ RouterLink],
  templateUrl: './breadcrumbs.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class BreadcrumbsComponent {
  @Input() items: BreadcrumbItem[] = [];
}
