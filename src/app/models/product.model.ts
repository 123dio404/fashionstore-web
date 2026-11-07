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
  tenant_id?: Id | null;
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
  size?: SizeResponse | { id: Id; name: string } | null;
  color?: ColorResponse | { id: Id; name: string } | null;
}

export interface ProductCreate {
  category_id: Id;
  season_id?: Id | null;
  name: string;
  brand?: string | null;
  price: number;
  wholesale_price?: number | null;
  wholesale_min_quantity?: number | null;
  material?: string | null;
  secondary_color?: string | null;
  is_clearance?: boolean;
  discount_percentage?: number | null;
  is_active?: boolean;
  image_url?: string | null;
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
  wholesale_price?: number | null;
  wholesale_min_quantity?: number | null;
  material?: string | null;
  secondary_color?: string | null;
  is_clearance?: boolean;
  discount_percentage?: number | null;
  is_active?: boolean;
  image_url?: string | null;
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
  wholesale_price: number | null;
  wholesale_min_quantity: number | null;
  material: string | null;
  secondary_color: string | null;
  is_clearance: boolean;
  discount_percentage: number | null;
  is_active: boolean;
  category_name?: string | null;
  tenant_id?: Id | null;
  image_url?: string | null;
  model_3d_url: string | null;
  model_3d_format: string | null;
  technical_metadata: string | null;
  variants: VariantResponse[];
}

export interface ClearanceBatchRequest {
  season_id?: Id | null;
  category_id?: Id | null;
  discount_percentage: number;
  is_clearance: boolean;
}

export interface ClearanceBatchResponse {
  message: string;
  updated_products_count: number;
  season_id: Id | null;
  category_id: Id | null;
  discount_percentage: number;
  is_clearance: boolean;
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
