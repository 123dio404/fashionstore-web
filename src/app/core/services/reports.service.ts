import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AnalyticalQueryRequest,
  AnalyticalQueryResponse,
  DashboardResponse,
  InventoryReportResponse,
  PurchaseHistoryResponse,
  SalesReportResponse,
  SpeechAnalyticalQueryResponse
} from '../../models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reports`;

  // CU16 - Purchase history
  purchaseHistory(filters?: {
    clientId?: number;
    startDate?: string;
    endDate?: string;
  }): Observable<PurchaseHistoryResponse> {
    let params = new HttpParams();
    if (filters?.clientId) params = params.set('client_id', filters.clientId);
    if (filters?.startDate) params = params.set('start_date', filters.startDate);
    if (filters?.endDate) params = params.set('end_date', filters.endDate);
    return this.http.get<PurchaseHistoryResponse>(`${this.url}/purchases/history`, { params });
  }

  // CU21 - Sales report
  salesReport(startDate?: string, endDate?: string): Observable<SalesReportResponse> {
    let params = new HttpParams();
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<SalesReportResponse>(`${this.url}/sales`, { params });
  }

  // CU22 - Inventory report
  inventoryReport(): Observable<InventoryReportResponse> {
    return this.http.get<InventoryReportResponse>(`${this.url}/inventory`);
  }

  // CU23 - Executive dashboard
  dashboard(startDate?: string, endDate?: string): Observable<DashboardResponse> {
    let params = new HttpParams();
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<DashboardResponse>(`${this.url}/executive`, { params });
  }

  // CU24 - Analytical query (text + voice)
  analyticalQuery(data: AnalyticalQueryRequest): Observable<AnalyticalQueryResponse> {
    return this.http.post<AnalyticalQueryResponse>(`${this.url}/analytical-query`, data);
  }

  analyticalQueryVoice(file: File, clientId?: number): Observable<SpeechAnalyticalQueryResponse> {
    const form = new FormData();
    form.append('audio', file);
    if (clientId) form.append('client_id', String(clientId));
    return this.http.post<SpeechAnalyticalQueryResponse>(
      `${this.url}/analytical-query/voice`,
      form
    );
  }
}
