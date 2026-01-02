import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';

@Component({
  selector: '[app-navlinks]',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './navlinks.component.html',
  styleUrl: './navlinks.component.css'
})
export class NavlinksComponent {

}
