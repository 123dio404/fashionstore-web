import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  BranchCreate,
  BranchResponse,
  BranchUpdate,
  CityCreate,
  CityResponse,
  CityUpdate
} from '../../models';

@Injectable({ providedIn: 'root' })
export class BranchesService {
  private readonly http = inject(HttpClient);
  private readonly citiesUrl = `${environment.apiUrl}/cities`;
  private readonly branchesUrl = `${environment.apiUrl}/branches`;

  listCities(): Observable<CityResponse[]> {
    return this.http.get<CityResponse[]>(this.citiesUrl);
  }

  createCity(data: CityCreate): Observable<CityResponse> {
    return this.http.post<CityResponse>(this.citiesUrl, data);
  }

  updateCity(id: number, data: CityUpdate): Observable<CityResponse> {
    return this.http.patch<CityResponse>(`${this.citiesUrl}/${id}`, data);
  }

  removeCity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.citiesUrl}/${id}`);
  }

  list(): Observable<BranchResponse[]> {
    return this.http.get<BranchResponse[]>(this.branchesUrl);
  }

  create(data: BranchCreate): Observable<BranchResponse> {
    return this.http.post<BranchResponse>(this.branchesUrl, data);
  }

  update(id: number, data: BranchUpdate): Observable<BranchResponse> {
    return this.http.patch<BranchResponse>(`${this.branchesUrl}/${id}`, data);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.branchesUrl}/${id}`);
  }
}
