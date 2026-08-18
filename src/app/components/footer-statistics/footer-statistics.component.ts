import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { UserShort } from '../../models/UserShort';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface RecentUser {
  id: number;
  username: string;
}

interface RecentCharacter {
  id: number;
  name: string;
}

@Component({
  selector: 'app-footer-statistics',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer-statistics.component.html',
})
export class FooterStatisticsComponent implements OnInit, OnDestroy {
  private boardService = inject(BoardService);
  private apiService = inject(ApiService);
  authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  private destroy$ = new Subject<void>();

  board = this.boardService.board;

  activeUsers = signal<UserShort[]>([]);
  activeGuests = signal<number>(0);

  recentMode = signal<'users' | 'characters'>('users');
  recentUsers = signal<RecentUser[]>([]);
  recentCharacters = signal<RecentCharacter[]>([]);

  private visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      this.fetchActiveUsers();
    }
  };

  ngOnInit() {
    this.fetchActiveUsers();
    this.apiService.get<RecentUser[]>('user/recent').subscribe(data => this.recentUsers.set(data));
    this.apiService.get<RecentCharacter[]>('character/recent').subscribe(data => this.recentCharacters.set(data));

    this.notificationService.activeUsersUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => this.activeUsers.set(event.data));

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  ngOnDestroy() {
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.destroy$.next();
    this.destroy$.complete();
  }

  setRecentMode(m: 'users' | 'characters') {
    this.recentMode.set(m);
  }

  private fetchActiveUsers() {
    this.apiService.get<{ guests: number; users: UserShort[] }>('active-users').subscribe(data => {
      this.activeUsers.set(data.users);
      this.activeGuests.set(data.guests);
    });
  }
}
