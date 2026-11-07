import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PlanCreateRequest,
  PlanResponse,
  PlanUpdateRequest,
  TenantCreateRequest,
  TenantResponse
} from '../../models';

@Injectable({ providedIn: 'root' })
export class SaasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/saas`;

  getPlans(includeInactive = false): Observable<PlanResponse[]> {
    let params = new HttpParams();
    if (includeInactive) params = params.set('include_inactive', 'true');
    return this.http.get<PlanResponse[]>(`${this.url}/plans`, { params });
  }

  createPlan(data: PlanCreateRequest): Observable<PlanResponse> {
    return this.http.post<PlanResponse>(`${this.url}/plans`, data);
  }

  updatePlan(id: number, data: PlanUpdateRequest): Observable<PlanResponse> {
    return this.http.patch<PlanResponse>(`${this.url}/plans/${id}`, data);
  }

  deletePlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/plans/${id}`);
  }

  getMySubscription(): Observable<TenantResponse> {
    return this.http.get<TenantResponse>(`${this.url}/my-subscription`);
  }

  changePlan(
    planName: string,
    options?: { months?: number; tenantId?: number }
  ): Observable<TenantResponse> {
    return this.http.post<TenantResponse>(`${this.url}/change-plan`, {
      plan_name: planName,
      months: options?.months ?? 12,
      tenant_id: options?.tenantId ?? null
    });
  }

  getTenants(): Observable<TenantResponse[]> {
    return this.http.get<TenantResponse[]>(`${this.url}/tenants`);
  }

  createTenant(data: TenantCreateRequest): Observable<TenantResponse> {
    return this.http.post<TenantResponse>(`${this.url}/tenants`, data);
  }
}
