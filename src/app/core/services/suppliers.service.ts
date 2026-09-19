import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SupplierCreate, SupplierResponse, SupplierUpdate } from '../../models';

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/suppliers`;

  list(): Observable<SupplierResponse[]> {
    return this.http.get<SupplierResponse[]>(this.url);
  }

  create(data: SupplierCreate): Observable<SupplierResponse> {
    return this.http.post<SupplierResponse>(this.url, data);
  }

  update(id: number, data: SupplierUpdate): Observable<SupplierResponse> {
    return this.http.patch<SupplierResponse>(`${this.url}/${id}`, data);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
