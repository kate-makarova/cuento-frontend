import {Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {AuthService} from '../../services/auth.service';

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
  private authService = inject(AuthService);
  public isAuthenticated = this.authService.isAuthenticated;

}
