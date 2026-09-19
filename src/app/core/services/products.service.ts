import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AvailabilityResponse,
  CategoryResponse,
  ColorResponse,
  ParameterCreate,
  ParameterUpdate,
  ProductCreate,
  ProductResponse,
  ProductUpdate,
  SeasonResponse,
  SizeResponse,
  VariantCreate,
  VariantResponse
} from '../../models';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // CU06 - Parameters
  listCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(`${this.base}/parameters/categories`);
  }
  createCategory(data: ParameterCreate): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(`${this.base}/parameters/categories`, data);
  }
  updateCategory(id: number, data: ParameterUpdate): Observable<CategoryResponse> {
    return this.http.patch<CategoryResponse>(`${this.base}/parameters/categories/${id}`, data);
  }
  removeCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/parameters/categories/${id}`);
  }

  listSeasons(): Observable<SeasonResponse[]> {
    return this.http.get<SeasonResponse[]>(`${this.base}/parameters/seasons`);
  }
  createSeason(data: ParameterCreate): Observable<SeasonResponse> {
    return this.http.post<SeasonResponse>(`${this.base}/parameters/seasons`, data);
  }
  updateSeason(id: number, data: ParameterUpdate): Observable<SeasonResponse> {
    return this.http.patch<SeasonResponse>(`${this.base}/parameters/seasons/${id}`, data);
  }
  removeSeason(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/parameters/seasons/${id}`);
  }

  listSizes(): Observable<SizeResponse[]> {
    return this.http.get<SizeResponse[]>(`${this.base}/parameters/sizes`);
  }
  createSize(data: ParameterCreate): Observable<SizeResponse> {
    return this.http.post<SizeResponse>(`${this.base}/parameters/sizes`, data);
  }
  updateSize(id: number, data: ParameterUpdate): Observable<SizeResponse> {
    return this.http.patch<SizeResponse>(`${this.base}/parameters/sizes/${id}`, data);
  }
  removeSize(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/parameters/sizes/${id}`);
  }

  listColors(): Observable<ColorResponse[]> {
    return this.http.get<ColorResponse[]>(`${this.base}/parameters/colors`);
  }
  createColor(data: ParameterCreate): Observable<ColorResponse> {
    return this.http.post<ColorResponse>(`${this.base}/parameters/colors`, data);
  }
  updateColor(id: number, data: ParameterUpdate): Observable<ColorResponse> {
    return this.http.patch<ColorResponse>(`${this.base}/parameters/colors/${id}`, data);
  }
  removeColor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/parameters/colors/${id}`);
  }

  // CU05 / CU08 - Products
  list(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(`${this.base}/products`);
  }
  get(id: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.base}/products/${id}`);
  }
  create(data: ProductCreate): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${this.base}/products`, data);
  }
  update(id: number, data: ProductUpdate): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.base}/products/${id}`, data);
  }
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/products/${id}`);
  }
  addVariant(productId: number, data: VariantCreate): Observable<VariantResponse> {
    return this.http.post<VariantResponse>(`${this.base}/products/${productId}/variants`, data);
  }
  availability(productId: number, branchId: number): Observable<AvailabilityResponse[]> {
    const params = new HttpParams().set('branch_id', branchId);
    return this.http.get<AvailabilityResponse[]>(
      `${this.base}/products/${productId}/availability`,
      { params }
    );
  }
}
