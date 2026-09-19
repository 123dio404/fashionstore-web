import { Id } from './common.model';

export interface PurchaseHistoryItem {
  product_id: Id;
  product_name: string;
  variant_id: Id;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface PurchaseHistoryEntry {
  sale_id: Id;
  sale_date: string;
  branch_id: Id;
  sale_type: string;
  total: number;
  items: PurchaseHistoryItem[];
}

export interface PurchaseHistoryResponse {
  client_id: Id;
  start_date: string | null;
  end_date: string | null;
  total_orders: number;
  total_spent: number;
  purchases: PurchaseHistoryEntry[];
}

export interface ReportRow {
  key: string;
  orders: number;
  units: number;
  revenue: number;
}

export interface SalesReportResponse {
  start_date: string;
  end_date: string;
  total_orders: number;
  total_units: number;
  total_revenue: number;
  average_order_value: number;
  by_channel: ReportRow[];
  by_branch: ReportRow[];
  by_day: ReportRow[];
}

export interface InventoryReportRow {
  stock_id: Id;
  branch_id: Id;
  product_id: Id;
  product_name: string;
  variant_id: Id;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
  min_stock: number;
  below_minimum: boolean;
}

export interface InventoryReportResponse {
  generated_at: string;
  total_skus: number;
  total_physical_units: number;
  total_available_units: number;
  low_stock_count: number;
  stock: InventoryReportRow[];
}

export interface DashboardResponse {
  start_date: string;
  end_date: string;
  total_orders: number;
  total_units: number;
  total_revenue: number;
  average_order_value: number;
  low_stock_count: number;
  inventory_value: number;
  top_products: Array<Record<string, unknown>>;
  channels: ReportRow[];
}

export interface AnalyticalQueryRequest {
  query: string;
  client_id?: Id | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface AnalyticalQueryResponse {
  query: string;
  intent: string;
  parameters: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface SpeechAnalyticalQueryResponse extends AnalyticalQueryResponse {
  transcript: string;
}
