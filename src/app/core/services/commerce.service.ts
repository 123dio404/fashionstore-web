import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CartItemRequest,
  CartItemUpdate,
  CartResponse,
  CheckoutRequest,
  PosSaleCreate,
  ReservationCreate,
  ReservationResponse,
  ReservationUpdate,
  SaleResponse
} from '../../models';

@Injectable({ providedIn: 'root' })
export class CommerceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/commerce`;

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.base}/cart`);
  }
  addItem(data: CartItemRequest): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.base}/cart/items`, data);
  }
  updateItem(itemId: number, data: CartItemUpdate): Observable<CartResponse> {
    return this.http.patch<CartResponse>(`${this.base}/cart/items/${itemId}`, data);
  }
  removeItem(itemId: number): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.base}/cart/items/${itemId}`);
  }
  checkout(data: CheckoutRequest): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(`${this.base}/cart/checkout`, data);
  }
  listSales(): Observable<SaleResponse[]> {
    return this.http.get<SaleResponse[]>(`${this.base}/sales`);
  }
  getSale(saleId: number): Observable<SaleResponse> {
    return this.http.get<SaleResponse>(`${this.base}/sales/${saleId}`);
  }
  createPosSale(data: PosSaleCreate): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(`${this.base}/sales/pos`, data);
  }
  listReservations(): Observable<ReservationResponse[]> {
    return this.http.get<ReservationResponse[]>(`${this.base}/reservations`);
  }
  createReservation(data: ReservationCreate): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.base}/reservations`, data);
  }
  updateReservation(id: number, data: ReservationUpdate): Observable<ReservationResponse> {
    return this.http.patch<ReservationResponse>(`${this.base}/reservations/${id}`, data);
  }
  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/reservations/${id}`);
  }
}