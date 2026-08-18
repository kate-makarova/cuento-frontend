import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../models/Category';
import { RouterLinksDirective } from '../../directives/router-links.directive';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [RouterLink, RouterLinksDirective, SafeHtmlPipe],
  templateUrl: './category.component.html',
})
export class CategoryComponent {
  @Input() category!: Category;
}
