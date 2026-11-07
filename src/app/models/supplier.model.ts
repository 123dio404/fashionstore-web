import { Id } from './common.model';

export interface SupplierCreate {
  name: string;
  ci: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  is_active?: boolean;
}

export type SupplierUpdate = Partial<SupplierCreate>;

export interface SupplierResponse {
  id: Id;
  name: string;
  ci: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
}

export interface PurchaseItem {
  variant_id: Id;
  quantity: number;
  unit_cost: number;
}

export interface PurchaseOrderCreate {
  branch_id: Id;
  invoice_number?: string | null;
  notes?: string | null;
  items: PurchaseItem[];
}

export interface PurchaseOrderResponse {
  id: Id;
  tenant_id: Id;
  supplier_id: Id;
  supplier_name: string;
  branch_id: Id;
  invoice_number: string | null;
  total_amount: number;
  total_items: number;
  created_at: string;
  message: string;
}
