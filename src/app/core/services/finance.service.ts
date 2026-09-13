import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FeeCreate,
  FeeResponse,
  FeeUpdate,
  FinancialReportResponse,
  FineCreate,
  FineResponse,
  FineUpdate,
  PaymentCreate,
  PaymentResponse
} from '../../models';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/finance`;

  listFees(feeType?: string, period?: string): Observable<FeeResponse[]> {
    return this.http.get<FeeResponse[]>(`${this.base}/fees`, {
      params: { ...(feeType ? { fee_type: feeType } : {}), ...(period ? { period } : {}) }
    });
  }
  getFee(id: number): Observable<FeeResponse> {
    return this.http.get<FeeResponse>(`${this.base}/fees/${id}`);
  }
  createFee(data: FeeCreate): Observable<FeeResponse> {
    return this.http.post<FeeResponse>(`${this.base}/fees`, data);
  }
  updateFee(id: number, data: FeeUpdate): Observable<FeeResponse> {
    return this.http.patch<FeeResponse>(`${this.base}/fees/${id}`, data);
  }
  deleteFee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/fees/${id}`);
  }
  listPayments(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.base}/payments`);
  }
  createPayment(data: PaymentCreate): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.base}/payments`, data);
  }
  listFines(): Observable<FineResponse[]> {
    return this.http.get<FineResponse[]>(`${this.base}/fines`);
  }
  createFine(data: FineCreate): Observable<FineResponse> {
    return this.http.post<FineResponse>(`${this.base}/fines`, data);
  }
  updateFine(id: number, data: FineUpdate): Observable<FineResponse> {
    return this.http.patch<FineResponse>(`${this.base}/fines/${id}`, data);
  }
  report(period: string): Observable<FinancialReportResponse> {
    return this.http.get<FinancialReportResponse>(`${this.base}/reports/financial`, {
      params: { period }
    });
  }
}