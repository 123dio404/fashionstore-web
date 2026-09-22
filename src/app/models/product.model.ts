import { Id } from './common.model';

export interface ParameterCreate {
  name: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface ParameterUpdate {
  name?: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface CategoryResponse {
  id: Id;
  name: string;
}

export interface SeasonResponse {
  id: Id;
  name: string;
  start_date: string | null;
  end_date: string | null;
}

export interface SizeResponse {
  id: Id;
  name: string;
}

export interface ColorResponse {
  id: Id;
  name: string;
}

export interface VariantCreate {
  size_id: Id;
  color_id: Id;
  codigo: string;
  price?: number | null;
}

export interface VariantResponse {
  id: Id;
  product_id: Id;
  size_id: Id | null;
  color_id: Id | null;
  codigo: string;
  price: number | null;
  is_active: boolean;
}

export interface ProductCreate {
  category_id: Id;
  season_id?: Id | null;
  name: string;
  brand?: string | null;
  price: number;
  is_active?: boolean;
  model_3d_url?: string | null;
  model_3d_format?: 'glb' | 'gltf' | null;
  technical_metadata?: string | null;
  variants?: VariantCreate[];
}

export interface ProductUpdate {
  category_id?: Id;
  season_id?: Id | null;
  name?: string;
  brand?: string | null;
  price?: number;
  is_active?: boolean;
  model_3d_url?: string | null;
  model_3d_format?: 'glb' | 'gltf' | null;
  technical_metadata?: string | null;
}

export interface ProductResponse {
  id: Id;
  category_id: Id;
  season_id: Id | null;
  name: string;
  brand: string | null;
  price: number;
  is_active: boolean;
  model_3d_url: string | null;
  model_3d_format: string | null;
  technical_metadata: string | null;
  variants: VariantResponse[];
}

export interface AvailabilityResponse {
  product_id: Id;
  variant_id: Id;
  branch_id: Id;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
  /** CU10/CU11 — fila de inventario que el carrito y el checkout usan para descontar. */
  stock_id: Id;
}
