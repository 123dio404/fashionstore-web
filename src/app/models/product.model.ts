import { UUID } from './common.model';

export interface ParameterCreate {
  name: string;
  description?: string;
  hex_code?: string;
}

export type ParameterUpdate = Partial<ParameterCreate>;

export interface CategoryResponse {
  id: UUID;
  name: string;
  description: string | null;
}

export interface SeasonResponse {
  id: UUID;
  name: string;
}

export interface SizeResponse {
  id: UUID;
  name: string;
}

export interface ColorResponse {
  id: UUID;
  name: string;
  hex_code: string;
}

export interface VariantCreate {
  size_id: UUID;
  color_id: UUID;
  barcode?: string;
}

export interface VariantResponse extends Omit<VariantCreate, 'barcode'> {
  id: UUID;
  product_id: UUID;
  barcode: string | null;
}

export interface ProductCreate {
  category_id: UUID;
  season_id?: UUID;
  supplier_id?: UUID;
  name: string;
  sku: string;
  description?: string;
  technical_metadata?: string;
  model_3d_url?: string;
  price: number;
  is_active?: boolean;
  variants?: VariantCreate[];
}

export type ProductUpdate = Partial<Omit<ProductCreate, 'variants'>>;

export interface ProductResponse extends Omit<
  ProductCreate,
  'variants' | 'season_id' | 'supplier_id' | 'description' | 'technical_metadata' | 'model_3d_url'
> {
  id: UUID;
  season_id: UUID | null;
  supplier_id: UUID | null;
  description: string | null;
  technical_metadata: string | null;
  model_3d_url: string | null;
  is_active: boolean;
  variants: VariantResponse[];
}

export interface AvailabilityResponse {
  product_id: UUID;
  variant_id: UUID;
  branch_id: UUID;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
}
