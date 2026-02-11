import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

interface AuthResponse {
  token: string;
  user: { id: number; email: string; name: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = 'http://localhost/api';

  // State management using Signals
  // Initial value checks if a token exists in storage
  currentUser = signal<AuthResponse['user'] | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    // Optional: Re-hydrate user state from token on app load
    const token = localStorage.getItem('jwt_token');
    if (token) {
      // You could also decode the JWT here to get user info
      // or call a /me endpoint to verify validity
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
    localStorage.removeItem('jwt_token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private handleAuth(response: AuthResponse) {
    localStorage.setItem('jwt_token', response.token);
    this.currentUser.set(response.user);
    this.router.navigate(['/dashboard']);
  }
}
