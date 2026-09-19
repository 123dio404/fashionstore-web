import { Id } from './common.model';

export enum MovementType {
  Ingreso = 'ingreso',
  Transferencia = 'transferencia',
  Ajuste = 'ajuste',
  Venta = 'venta',
  Reserva = 'reserva'
}

export interface StockResponse {
  id: Id;
  branch_id: Id;
  variant_id: Id;
  size_id: Id | null;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
}

export interface StockAdjustment {
  branch_id: Id;
  variant_id: Id;
  quantity: number;
  reason?: string | null;
}

export interface MovementCreate {
  movement_type?: MovementType;
  variant_id: Id;
  source_branch_id?: Id | null;
  destination_branch_id?: Id | null;
  quantity: number;
  reason?: string | null;
}

export interface TransferRequest {
  variant_id: Id;
  source_branch_id: Id;
  destination_branch_id: Id;
  quantity: number;
  reason?: string | null;
}

export interface MovementResponse {
  id: Id;
  movement_type: MovementType;
  inventory_id: Id;
  variant_id: Id;
  quantity: number;
  reason: string | null;
  created_at: string;
}
