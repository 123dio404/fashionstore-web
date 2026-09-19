import { Id } from './common.model';

export interface CollectionCreate {
  name: string;
  description?: string | null;
  is_active?: boolean;
  product_ids?: Id[];
}

export interface CollectionResponse {
  id: Id;
  name: string;
  description: string | null;
  is_active: boolean;
  product_ids: Id[];
  created_at: string;
}

export interface PromotionCreate {
  name: string;
  description?: string | null;
  discount_type?: 'percentage' | 'fixed';
  discount_value: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  product_ids?: Id[];
}

export interface PromotionResponse {
  id: Id;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  product_ids: Id[];
}
