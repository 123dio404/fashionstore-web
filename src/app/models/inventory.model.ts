import { ID } from './common.model';

export enum MovementType {
  Ingreso = 'ingreso',
  Transferencia = 'transferencia',
  Ajuste = 'ajuste',
  Venta = 'venta',
  Reserva = 'reserva'
}

export interface StockResponse {
  id: ID;
  branch_id: ID;
  variant_id: ID;
  size_id: ID | null;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
}

export interface StockAdjustment {
  branch_id: ID;
  variant_id: ID;
  quantity: number;
  reason?: string;
}

export interface MovementCreate {
  movement_type?: MovementType;
  variant_id: ID;
  source_branch_id?: ID;
  destination_branch_id?: ID;
  quantity: number;
  reason?: string;
}

export interface TransferRequest {
  variant_id: ID;
  source_branch_id: ID;
  destination_branch_id: ID;
  quantity: number;
  reason?: string;
}

export interface MovementResponse {
  id: ID;
  movement_type: MovementType;
  inventory_id: ID;
  variant_id: ID;
  quantity: number;
  reason: string | null;
  created_at: string;
}

export interface AvailabilityResponse {
  product_id: ID;
  variant_id: ID;
  branch_id: ID;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
}