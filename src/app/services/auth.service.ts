import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../core/api.constants';
import { User } from '../models/user.model';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly token = signal<string | null>(this.readStoredToken());
  private readonly currentUser = signal<User | null>(this.readStoredUser());

  readonly isLoggedIn = computed(() => this.token() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  getAuthStatus() {
    return this.isLoggedIn;
  }

  getCurrentUser() {
    return this.currentUser.asReadonly();
  }

  getToken(): string | null {
    return this.token();
  }

  register(name: string, email: string, password: string): Observable<User> {
    return this.http.post<User>(`${API_BASE_URL}/auth/register`, { name, email, password });
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/auth/login`, { email, password })
      .pipe(
        tap((response) => {
          this.token.set(response.token);
          this.currentUser.set(response.user);
          this.persist(response.token, response.user);
        })
      );
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  private persist(token: string, user: User) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private readStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private readStoredUser(): User | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }
}
