import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type QueryParams = Record<string, string | number | boolean | undefined>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  list<T>(resource: string, query?: QueryParams): Observable<T[]> {
    return this.http.get<T[]>(`${this.base}/${resource}`, { params: this.params(query) });
  }
  get<T>(resource: string, query?: QueryParams): Observable<T> {
    return this.http.get<T>(`${this.base}/${resource}`, { params: this.params(query) });
  }
  create<T>(resource: string, value: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}/${resource}`, value);
  }
  post<T>(resource: string, value: unknown, query?: QueryParams): Observable<T> {
    return this.http.post<T>(`${this.base}/${resource}`, value, { params: this.params(query) });
  }
  update<T>(resource: string, id: string | number, value: unknown): Observable<T> {
    return this.http.patch<T>(`${this.base}/${resource}/${id}`, value);
  }
  put<T>(resource: string, id: string | number, value: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}/${resource}/${id}`, value);
  }
  patch<T>(resource: string, value: unknown): Observable<T> {
    return this.http.patch<T>(`${this.base}/${resource}`, value);
  }
  remove(resource: string, id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${resource}/${id}`);
  }
  delete(resource: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${resource}`);
  }

  private params(query?: QueryParams): HttpParams {
    let params = new HttpParams();
    Object.entries(query ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}