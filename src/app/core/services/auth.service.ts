import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginResponse, ProfileUpdate, RegisterRequest, UserResponse } from '../../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiUrl}/auth`;
  private readonly usersUrl = `${environment.apiUrl}/users`;
  private readonly tokenKey = 'fashionstore_access_token';
  private readonly userKey = 'fashionstore_cached_user';
  readonly currentUser = signal<UserResponse | null>(null);

  register(data: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.authUrl}/register`, data);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const body = new HttpParams().set('username', email).set('password', password);
    return this.http
      .post<LoginResponse>(`${this.authUrl}/login`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      .pipe(tap((response) => this.setSession(response)));
  }

  getCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.usersUrl}/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        localStorage.setItem(this.userKey, JSON.stringify(user));
      })
    );
  }

  restoreSession(): Observable<UserResponse | null> {
    if (!this.hasToken()) return of(null);
    return this.getCurrentUser().pipe(
      catchError((err: { status?: number }) => {
        // Si el fallo es por falta de red (status 0 o sin internet), mantener sesión localmente
        if (err?.status === 0 || (typeof navigator !== 'undefined' && !navigator.onLine)) {
          const raw = localStorage.getItem(this.userKey);
          if (raw) {
            try {
              const cachedUser = JSON.parse(raw) as UserResponse;
              this.currentUser.set(cachedUser);
              return of(cachedUser);
            } catch {}
          }
        }
        // Solo si es un 401 real de backend se expira la sesión
        if (err?.status === 401) {
          this.logout();
        }
        return of(null);
      })
    );
  }

  updateProfile(data: ProfileUpdate): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.usersUrl}/me`, data).pipe(
      tap((user) => {
        this.currentUser.set(user);
        localStorage.setItem(this.userKey, JSON.stringify(user));
      })
    );
  }

  changePassword(current_password: string, new_password: string, confirm_password: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.authUrl}/change-password`, {
      current_password,
      new_password,
      confirm_password
    });
  }

  forgotPassword(email: string): Observable<{ detail: string; reset_link?: string; email_sent: boolean }> {
    return this.http.post<{ detail: string; reset_link?: string; email_sent: boolean }>(`${this.authUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, new_password: string, confirm_password: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.authUrl}/reset-password`, {
      token,
      new_password,
      confirm_password
    });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  hasToken(): boolean {
    return Boolean(this.getToken());
  }

  private setSession(response: LoginResponse): void {
    localStorage.setItem(this.tokenKey, response.access_token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }
}
