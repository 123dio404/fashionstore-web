import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Small, typed gateway for the cycle-one resources. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  list<T>(resource: string, query?: Record<string, string | number | undefined>): Observable<T[]> {
    let params = new HttpParams();
    Object.entries(query ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<T[]>(`${this.base}/${resource}`, { params });
  }
  get<T>(resource: string): Observable<T> {
    return this.http.get<T>(`${this.base}/${resource}`);
  }
  create<T>(resource: string, value: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}/${resource}`, value);
  }
  update<T>(resource: string, id: string, value: unknown): Observable<T> {
    return this.http.patch<T>(`${this.base}/${resource}/${id}`, value);
  }
  remove(resource: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${resource}/${id}`);
  }
}
