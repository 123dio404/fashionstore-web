import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FacilityAvailabilityResponse,
  FacilityCreate,
  FacilityReservationCreate,
  FacilityReservationResponse,
  FacilityReservationUpdate,
  FacilityResponse,
  FacilityUpdate,
  FacilityUsageResponse,
  MaintenanceCreate,
  MaintenanceResponse,
  MaintenanceUpdate
} from '../../models';

@Injectable({ providedIn: 'root' })
export class OperationsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/operations`;

  listFacilities(activeOnly = false): Observable<FacilityResponse[]> {
    return this.http.get<FacilityResponse[]>(`${this.base}/facilities`, {
      params: { active_only: activeOnly }
    });
  }
  createFacility(data: FacilityCreate): Observable<FacilityResponse> {
    return this.http.post<FacilityResponse>(`${this.base}/facilities`, data);
  }
  updateFacility(id: number, data: FacilityUpdate): Observable<FacilityResponse> {
    return this.http.patch<FacilityResponse>(`${this.base}/facilities/${id}`, data);
  }
  deleteFacility(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/facilities/${id}`);
  }
  availability(facilityId: number, date: string): Observable<FacilityAvailabilityResponse> {
    return this.http.get<FacilityAvailabilityResponse>(`${this.base}/facilities/${facilityId}/availability`, {
      params: { date }
    });
  }
  listReservations(): Observable<FacilityReservationResponse[]> {
    return this.http.get<FacilityReservationResponse[]>(`${this.base}/reservations`);
  }
  createReservation(data: FacilityReservationCreate): Observable<FacilityReservationResponse> {
    return this.http.post<FacilityReservationResponse>(`${this.base}/reservations`, data);
  }
  updateReservation(id: number, data: FacilityReservationUpdate): Observable<FacilityReservationResponse> {
    return this.http.patch<FacilityReservationResponse>(`${this.base}/reservations/${id}`, data);
  }
  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/reservations/${id}`);
  }
  listTasks(): Observable<MaintenanceResponse[]> {
    return this.http.get<MaintenanceResponse[]>(`${this.base}/maintenance/tasks`);
  }
  createTask(data: MaintenanceCreate): Observable<MaintenanceResponse> {
    return this.http.post<MaintenanceResponse>(`${this.base}/maintenance/tasks`, data);
  }
  updateTask(id: number, data: MaintenanceUpdate): Observable<MaintenanceResponse> {
    return this.http.patch<MaintenanceResponse>(`${this.base}/maintenance/tasks/${id}`, data);
  }
  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/maintenance/tasks/${id}`);
  }
  usageReport(period: string): Observable<FacilityUsageResponse> {
    return this.http.get<FacilityUsageResponse>(`${this.base}/reports/facility-usage`, {
      params: { period }
    });
  }
}