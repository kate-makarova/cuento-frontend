import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../models/User';


interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = 'http://localhost/api';

  // State management using Signals
  // Initial value checks if a token exists in storage
  currentUser = signal<AuthResponse['user'] | null>(null);
  isAuthenticated = computed(() => !!this.currentUser()?.id);
  authToken = signal<string|null>(null);
  isAdmin = computed(() => this.hasRole('admin'));

  constructor() {
    // Optional: Re-hydrate user state from token on app load
    const token = localStorage.getItem('jwt_token');
    const userString = localStorage.getItem('user');
    if (token && userString) {
      this.currentUser.set(JSON.parse(userString));
      this.authToken.set(token);
    } else {
      this.currentUser.set({
        id: 0,
        username: 'Гость',
        email: "",
        avatar: "",
        roles: [{
          id: 1,
          name: 'guest'
        }]
      })
    }
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
      next: () => this.clearAuth(),
      error: () => this.clearAuth()
    });
  }

  private clearAuth() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
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
    this.authToken.set(null);
    this.router.navigate(['/login']);
  }

  private handleAuth(response: AuthResponse) {
    localStorage.setItem('jwt_token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUser.set(response.user);
    this.authToken.set(response.token);
    this.router.navigate(['/dashboard']);
  }

  public hasRole(name: string) {
    const user = this.currentUser();
    console.log('hasRole check:', { name, user, roles: user?.roles });
    if (user == null || user.id === 0) {
      return false;
    }
    const role = user.roles?.find(role => role.name === name);
    console.log('Role found:', role);
    return !!role;
  }
}
