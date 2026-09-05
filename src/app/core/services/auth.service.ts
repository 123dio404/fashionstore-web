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
      tap((user) => this.currentUser.set(user))
    );
  }

  restoreSession(): Observable<UserResponse | null> {
    return this.hasToken()
      ? this.getCurrentUser().pipe(catchError(() => {
          this.logout();
          return of(null);
        }))
      : of(null);
  }

  updateProfile(data: ProfileUpdate): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.usersUrl}/me`, data).pipe(
      tap((user) => this.currentUser.set(user))
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
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
    this.currentUser.set(response.user);
  }
}
