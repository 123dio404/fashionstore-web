import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UserCreate, UserResponse, UserUpdate } from '../../models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;

  list(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.url);
  }

  create(data: UserCreate): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.url, data);
  }

  update(id: number, data: UserUpdate): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.url}/${id}`, data);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
