import { Component, Input } from '@angular/core';

import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-breadcrumbs',
  imports: [ RouterLink],
  templateUrl: './breadcrumbs.component.html',
  standalone: true,
})
export class BreadcrumbsComponent {
  @Input() items: BreadcrumbItem[] = [];
}
