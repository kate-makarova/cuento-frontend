import { Component } from '@angular/core';
import {NavlinksComponent} from '../navlinks/navlinks.component';
import {FooterComponent} from '../footer/footer.component';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  imports: [
    RouterLink
  ]
})
export class HomeComponent {
}
