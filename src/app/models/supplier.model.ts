import { UUID } from './common.model';

export interface SupplierCreate {
  name: string;
  tax_id: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export type SupplierUpdate = Partial<SupplierCreate>;

export interface SupplierResponse extends Omit<SupplierCreate, 'contact_name' | 'email' | 'phone' | 'address' | 'notes'> {
  id: UUID;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}
