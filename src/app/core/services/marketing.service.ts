import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CollectionCreate,
  CollectionResponse,
  PromotionCreate,
  PromotionResponse
} from '../../models';

@Injectable({ providedIn: 'root' })
export class MarketingService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listCollections(activeOnly = false): Observable<CollectionResponse[]> {
    const params = new HttpParams().set('active_only', activeOnly);
    return this.http.get<CollectionResponse[]>(`${this.base}/collections`, { params });
  }
  createCollection(data: CollectionCreate): Observable<CollectionResponse> {
    return this.http.post<CollectionResponse>(`${this.base}/collections`, data);
  }
  updateCollection(id: number, data: CollectionCreate): Observable<CollectionResponse> {
    return this.http.put<CollectionResponse>(`${this.base}/collections/${id}`, data);
  }
  removeCollection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/collections/${id}`);
  }

  listPromotions(activeOnly = false): Observable<PromotionResponse[]> {
    const params = new HttpParams().set('active_only', activeOnly);
    return this.http.get<PromotionResponse[]>(`${this.base}/promotions`, { params });
  }
  createPromotion(data: PromotionCreate): Observable<PromotionResponse> {
    return this.http.post<PromotionResponse>(`${this.base}/promotions`, data);
  }
  updatePromotion(id: number, data: PromotionCreate): Observable<PromotionResponse> {
    return this.http.put<PromotionResponse>(`${this.base}/promotions/${id}`, data);
  }
  removePromotion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/promotions/${id}`);
  }
}
