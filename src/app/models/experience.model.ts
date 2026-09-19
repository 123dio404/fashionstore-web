import { Id } from './common.model';

export interface UserPreferenceUpsert {
  category_id?: Id | null;
  preferred_brand?: string | null;
  preferred_colors?: string[] | null;
  preferred_sizes?: number[] | null;
  min_price?: number | null;
  max_price?: number | null;
}

export interface UserPreferenceResponse {
  id: Id;
  user_id: Id;
  category_id: Id | null;
  preferred_brand: string | null;
  preferred_colors: string[] | null;
  preferred_sizes: number[] | null;
  min_price: number | null;
  max_price: number | null;
  updated_at: string;
}

export interface RecommendationItemResponse {
  id: Id;
  product_id: Id;
  score: number;
  reason: string | null;
}

export interface RecommendationResponse {
  id: Id;
  user_id: Id;
  recommendation_type: string;
  created_at: string;
  status: string;
  items: RecommendationItemResponse[];
}

export interface ChatMessageCreate {
  content: string;
}

export interface ChatMessageResponse {
  id: Id;
  conversation_id: Id;
  role: string;
  content: string;
  context: Record<string, unknown> | null;
  created_at: string;
}

export interface ChatConversationCreate {
  title?: string | null;
}

export interface ChatConversationResponse {
  id: Id;
  user_id: Id;
  title: string | null;
  context: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  messages: ChatMessageResponse[];
}

export interface FittingSessionCreate {
  model_url?: string | null;
  model_format?: 'glb' | 'gltf' | null;
}

export interface FittingSessionResponse {
  id: Id;
  user_id: Id;
  model_url: string | null;
  model_format: string | null;
  status: string;
  created_at: string;
  results: Array<Record<string, unknown>>;
}

export interface ExecutiveAnalyticsResponse {
  start_date: string;
  end_date: string;
  total_orders: number;
  total_units: number;
  total_revenue: number;
  average_order_value: number;
  channels: Array<{ channel: string; orders: number; units: number; revenue: number }>;
  inventory_rotation: Array<{
    product_id: Id;
    product_name: string;
    units_sold: number;
    current_stock: number;
    rotation_rate: number;
  }>;
}
