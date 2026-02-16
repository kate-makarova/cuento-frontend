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
  protected authService = inject(AuthService);
  public isAuthenticated = this.authService.isAuthenticated;
  public currentUser = this.authService.currentUser;

  logout(event: Event) {
    event.preventDefault();
    this.authService.logout();
  }
}
