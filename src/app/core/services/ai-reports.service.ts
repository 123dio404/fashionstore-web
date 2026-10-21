import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AiReportResponse } from '../../models';

@Injectable({ providedIn: 'root' })
export class AiReportsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ai-reports`;

  queryReport(query: string): Observable<AiReportResponse> {
    return this.http.post<AiReportResponse>(`${this.url}/query`, { query });
  }

  getBranchSales(days = 30): Observable<AiReportResponse> {
    return this.http.get<AiReportResponse>(`${this.url}/sales-by-branch?days=${days}`);
  }

  getTopProducts(limit = 10): Observable<AiReportResponse> {
    return this.http.get<AiReportResponse>(`${this.url}/top-products?limit=${limit}`);
  }

  getQuarterlyComparison(): Observable<AiReportResponse> {
    return this.http.get<AiReportResponse>(`${this.url}/quarterly-comparison`);
  }

  getLowStockRisk(): Observable<AiReportResponse> {
    return this.http.get<AiReportResponse>(`${this.url}/low-stock-risk`);
  }

  exportPdf(reportData: any): Observable<Blob> {
    return this.http.post(`${this.url}/export/pdf`, { report_data: reportData }, {
      responseType: 'blob'
    });
  }

  exportExcel(reportData: any): Observable<Blob> {
    return this.http.post(`${this.url}/export/excel`, { report_data: reportData }, {
      responseType: 'blob'
    });
  }
}
