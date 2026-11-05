import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlanResponse, TenantCreateRequest, TenantResponse } from '../../models';

@Injectable({ providedIn: 'root' })
export class SaasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/saas`;

  getPlans(): Observable<PlanResponse[]> {
    return this.http.get<PlanResponse[]>(`${this.url}/plans`);
  }

  getMySubscription(): Observable<TenantResponse> {
    return this.http.get<TenantResponse>(`${this.url}/my-subscription`);
  }

  changePlan(planName: string): Observable<TenantResponse> {
    return this.http.post<TenantResponse>(`${this.url}/change-plan`, { plan_name: planName });
  }

  getTenants(): Observable<TenantResponse[]> {
    return this.http.get<TenantResponse[]>(`${this.url}/tenants`);
  }

  createTenant(data: TenantCreateRequest): Observable<TenantResponse> {
    return this.http.post<TenantResponse>(`${this.url}/tenants`, data);
  }
}
