import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ChatConversationCreate,
  ChatConversationResponse,
  ChatMessageCreate,
  ChatMessageResponse,
  ExecutiveAnalyticsResponse,
  FittingSessionCreate,
  FittingSessionResponse,
  FittingSessionStatusUpdate,
  RecommendationResponse,
  RecommendationStatus,
  UserPreferenceResponse,
  UserPreferenceUpsert
} from '../../models';

@Injectable({ providedIn: 'root' })
export class ExperienceService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // CU17 - Virtual fitting sessions (consumed by AR clients)
  createFittingSession(data: FittingSessionCreate): Observable<FittingSessionResponse> {
    return this.http.post<FittingSessionResponse>(`${this.base}/virtual-fitting/sessions`, data);
  }
  getFittingSession(id: number): Observable<FittingSessionResponse> {
    return this.http.get<FittingSessionResponse>(`${this.base}/virtual-fitting/sessions/${id}`);
  }
  completeFittingSession(id: number, data: FittingSessionStatusUpdate): Observable<FittingSessionResponse> {
    return this.http.patch<FittingSessionResponse>(`${this.base}/virtual-fitting/sessions/${id}`, data);
  }

  // CU18 - Personalized recommendations
  getPreferences(): Observable<UserPreferenceResponse | null> {
    return this.http.get<UserPreferenceResponse | null>(`${this.base}/recommendations/preferences`);
  }
  savePreferences(data: UserPreferenceUpsert): Observable<UserPreferenceResponse> {
    return this.http.put<UserPreferenceResponse>(`${this.base}/recommendations/preferences`, data);
  }
  generateRecommendations(limit = 10): Observable<RecommendationResponse> {
    const params = new HttpParams().set('limit', limit);
    return this.http.post<RecommendationResponse>(`${this.base}/recommendations`, {}, { params });
  }
  listRecommendations(limit = 20): Observable<RecommendationResponse[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<RecommendationResponse[]>(`${this.base}/recommendations`, { params });
  }
  updateRecommendationStatus(
    id: number,
    status: RecommendationStatus
  ): Observable<RecommendationResponse> {
    return this.http.patch<RecommendationResponse>(`${this.base}/recommendations/${id}`, { status });
  }

  // CU19 - Intelligent chatbot
  createConversation(data: ChatConversationCreate): Observable<ChatConversationResponse> {
    return this.http.post<ChatConversationResponse>(`${this.base}/chatbot/conversations`, data);
  }
  listConversations(): Observable<ChatConversationResponse[]> {
    return this.http.get<ChatConversationResponse[]>(`${this.base}/chatbot/conversations`);
  }
  getConversation(id: number): Observable<ChatConversationResponse> {
    return this.http.get<ChatConversationResponse>(`${this.base}/chatbot/conversations/${id}`);
  }
  sendMessage(id: number, data: ChatMessageCreate): Observable<ChatMessageResponse> {
    return this.http.post<ChatMessageResponse>(
      `${this.base}/chatbot/conversations/${id}/messages`,
      data
    );
  }

  // CU23 - Executive analytics (complementary)
  executiveAnalytics(startDate?: string, endDate?: string): Observable<ExecutiveAnalyticsResponse> {
    let params = new HttpParams();
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<ExecutiveAnalyticsResponse>(`${this.base}/analytics/executive`, { params });
  }
}
