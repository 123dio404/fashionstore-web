import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  MovementCreate,
  MovementResponse,
  StockAdjustment,
  StockResponse,
  TransferRequest
} from '../../models';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/inventory`;

  listStock(branchId?: number, variantId?: number): Observable<StockResponse[]> {
    let params = new HttpParams();
    if (branchId) params = params.set('branch_id', branchId);
    if (variantId) params = params.set('variant_id', variantId);
    return this.http.get<StockResponse[]>(`${this.url}/stock`, { params });
  }

  listMovements(branchId?: number, variantId?: number): Observable<MovementResponse[]> {
    let params = new HttpParams();
    if (branchId) params = params.set('branch_id', branchId);
    if (variantId) params = params.set('variant_id', variantId);
    return this.http.get<MovementResponse[]>(`${this.url}/movements`, { params });
  }

  adjust(data: StockAdjustment): Observable<StockResponse> {
    return this.http.post<StockResponse>(`${this.url}/movements/adjustment`, data);
  }

  movement(data: MovementCreate): Observable<StockResponse | MovementResponse> {
    return this.http.post<StockResponse | MovementResponse>(`${this.url}/movements`, data);
  }

  transfer(data: TransferRequest): Observable<MovementResponse> {
    return this.http.post<MovementResponse>(`${this.url}/transfers`, data);
  }
}
