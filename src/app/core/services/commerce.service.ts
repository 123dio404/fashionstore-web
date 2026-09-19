import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CartItemRequest,
  CartResponse,
  CheckoutRequest,
  PosSaleCreate,
  ReceiptResponse,
  ReservationCreate,
  ReservationResponse,
  ReservationUpdate,
  SaleResponse
} from '../../models';

@Injectable({ providedIn: 'root' })
export class CommerceService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/commerce`;

  // CU10 - Cart
  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.url}/cart`);
  }
  addItem(data: CartItemRequest): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.url}/cart/items`, data);
  }
  updateItem(itemId: number, quantity: number): Observable<CartResponse> {
    return this.http.patch<CartResponse>(`${this.url}/cart/items/${itemId}`, { quantity });
  }
  removeItem(itemId: number): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.url}/cart/items/${itemId}`);
  }

  // CU11 - Checkout
  checkout(data: CheckoutRequest): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(`${this.url}/cart/checkout`, data);
  }

  // CU12 - Sales / POS
  listSales(): Observable<SaleResponse[]> {
    return this.http.get<SaleResponse[]>(`${this.url}/sales`);
  }
  getSale(id: number): Observable<SaleResponse> {
    return this.http.get<SaleResponse>(`${this.url}/sales/${id}`);
  }
  getReceipt(id: number): Observable<ReceiptResponse> {
    return this.http.get<ReceiptResponse>(`${this.url}/sales/${id}/receipt`);
  }
  posSale(data: PosSaleCreate): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(`${this.url}/sales/pos`, data);
  }

  // CU13 / CU14 / CU15 - Reservations
  listReservations(filters?: {
    status?: string;
    branchId?: number;
    date?: string;
  }): Observable<ReservationResponse[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.branchId) params = params.set('branch_id', filters.branchId);
    if (filters?.date) params = params.set('reservation_date', filters.date);
    return this.http.get<ReservationResponse[]>(`${this.url}/reservations`, { params });
  }
  createReservation(data: ReservationCreate): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.url}/reservations`, data);
  }
  updateReservation(id: number, data: ReservationUpdate): Observable<ReservationResponse> {
    return this.http.patch<ReservationResponse>(`${this.url}/reservations/${id}`, data);
  }
  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/reservations/${id}`);
  }
}
