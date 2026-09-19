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
