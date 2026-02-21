import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../models/User';
import { BehaviorSubject, Observable } from 'rxjs';

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = 'http://localhost/api';
  private authChannel = new BroadcastChannel('auth_channel');

  currentUser = signal<AuthResponse['user'] | null>(null);
  isAuthenticated = computed(() => !!this.currentUser()?.id);
  authToken = signal<string|null>(null);
  isAdmin = computed(() => this.hasRole('admin'));

  isRefreshing = false;
  refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor() {
    const token = localStorage.getItem('jwt_token');
    const userString = localStorage.getItem('user');
    if (token && userString) {
      this.currentUser.set(JSON.parse(userString));
      this.authToken.set(token);
    } else {
      this.setGuestUser();
    }
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}).pipe(
      tap((response: AuthResponse) => {
        this.handleAuth(response, false);
      })
    );
  }

  register(data: any) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  login(credentials: { username: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  logout() {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.clearLocalAuth(true),
      error: () => this.clearLocalAuth(true)
    });
  }

  public clearLocalAuth(notify: boolean = true) {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    this.setGuestUser();
    this.authToken.set(null);
    if (notify) {
      this.authChannel.postMessage('logout');
    }
    this.router.navigate(['/login']);
  }

  private handleAuth(response: AuthResponse, navigate: boolean = true) {
    localStorage.setItem('jwt_token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUser.set(response.user);
    this.authToken.set(response.token);
    this.authChannel.postMessage('login');
    if (navigate) {
      this.router.navigate(['/dashboard']);
    }
  }

  private setGuestUser() {
    this.currentUser.set({
      id: 0,
      username: 'Гость',
      email: "",
      avatar: "",
      roles: [{
        id: 1,
        name: 'guest'
      }]
    });
  }

  public hasRole(name: string) {
    const user = this.currentUser();
    if (user == null || user.id === 0) {
      return false;
    }
    const role = user.roles?.find(role => role.name === name);
    return !!role;
  }
}
