import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CustomerSegmentsResponse,
  DemandPredictionResponse,
  MlDashboardResponse,
  MlStatusResponse
} from '../../models';

@Injectable({ providedIn: 'root' })
export class MlService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ml`;

  getStatus(): Observable<MlStatusResponse> {
    return this.http.get<MlStatusResponse>(`${this.url}/status`);
  }

  trainModels(): Observable<{ message: string; demand_metrics: any; clustering_metrics: any }> {
    return this.http.post<any>(`${this.url}/train`, {});
  }

  predictDemand(params: {
    branch_id?: number;
    category_id?: number;
    days?: number;
  }): Observable<DemandPredictionResponse> {
    return this.http.post<DemandPredictionResponse>(`${this.url}/predict-demand`, params);
  }

  getCustomerSegments(): Observable<CustomerSegmentsResponse> {
    return this.http.get<CustomerSegmentsResponse>(`${this.url}/customer-segments`);
  }

  getDashboard(): Observable<MlDashboardResponse> {
    return this.http.get<MlDashboardResponse>(`${this.url}/dashboard`);
  }
}
