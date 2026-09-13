import { ID } from './common.model';

export interface ParameterCreate {
  name: string;
}

export type ParameterUpdate = Partial<ParameterCreate>;

export interface CategoryResponse {
  id: ID;
  name: string;
}

export interface SeasonResponse {
  id: ID;
  name: string;
}

export interface SizeResponse {
  id: ID;
  name: string;
}

export interface ColorResponse {
  id: ID;
  name: string;
}

export interface VariantCreate {
  size_id: ID;
  color_id: ID;
  codigo: string;
  price?: number;
}

export interface VariantResponse {
  id: ID;
  product_id: ID;
  size_id: ID | null;
  color_id: ID | null;
  codigo: string;
  price: number | null;
  is_active: boolean;
}

export interface ProductCreate {
  category_id: ID;
  name: string;
  brand?: string;
  price: number;
  is_active?: boolean;
  variants?: VariantCreate[];
}

export type ProductUpdate = Partial<Omit<ProductCreate, 'variants'>>;

export interface ProductResponse {
  id: ID;
  category_id: ID;
  name: string;
  brand: string | null;
  price: number;
  is_active: boolean;
  variants: VariantResponse[];
}

export interface ProductStockView {
  stockId: ID;
  variantId: ID;
  branchId: ID;
  availableStock: number;
}