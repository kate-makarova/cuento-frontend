import {Component, effect, inject, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {FooterComponent} from './components/footer/footer.component';
import {NavlinksComponent} from './components/navlinks/navlinks.component';
import {filter, map, mergeMap} from 'rxjs';
import {ToastComponent} from './components/toast/toast.component';
import {BoardService} from './services/board.service';
import {AuthService} from './services/auth.service';
import {NotificationsComponent} from './components/notifications/notifications.component';
import {NotificationService} from './services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent, NavlinksComponent, ToastComponent, NotificationsComponent],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authChannel = new BroadcastChannel('auth_channel');

  title = 'dunebb';
  pageId = 'pun-main';
  boardService = inject(BoardService);
  authService = inject(AuthService);
  currentUser = this.authService.currentUser;
  currentDate = new Date();
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService('http://localhost:8080');
    this.listenForAuthChanges();
    this.setupRouteListener();

    // Effect to connect/disconnect notification service based on auth state
    effect(() => {
      const user = this.currentUser();
      const token = this.authService.authToken();
      if (user && user.id !== 0 && token) {
        console.log('Auth state is now AUTHENTICATED. Connecting to notification service...');
        this.notificationService.connect(token);
      } else {
        console.log('Auth state is now UNAUTHENTICATED. Disconnecting from notification service...');
        this.notificationService.disconnect();
      }
    });
  }

  ngOnInit() {
    this.boardService.loadBoard();
  }

  private setupRouteListener() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data)
    ).subscribe(data => {
      this.pageId = data['pageId'] || 'pun-index';
    });
  }

  private listenForAuthChanges(): void {
    this.authChannel.onmessage = (event) => {
      if (event.data === 'logout') {
        // When another tab logs out, update this tab's state
        this.authService.logout(); // This will clear local state and navigate
      } else if (event.data === 'login') {
        // When another tab logs in, reload the page to get the new state
        window.location.reload();
      }
    };
  }

  protected readonly Date = Date;
}
