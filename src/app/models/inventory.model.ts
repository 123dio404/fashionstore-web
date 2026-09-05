import { UUID } from './common.model';

export enum MovementType {
  Ingreso = 'ingreso',
  Transferencia = 'transferencia',
  Ajuste = 'ajuste'
}

export interface StockResponse {
  id: UUID;
  branch_id: UUID;
  variant_id: UUID;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
}

export interface StockAdjustment {
  branch_id: UUID;
  variant_id: UUID;
  quantity: number;
  reason?: string;
}

export interface MovementCreate {
  movement_type?: MovementType;
  variant_id: UUID;
  source_branch_id?: UUID;
  destination_branch_id?: UUID;
  quantity: number;
  reason?: string;
}

export interface TransferRequest {
  variant_id: UUID;
  source_branch_id: UUID;
  destination_branch_id: UUID;
  quantity: number;
  reason?: string;
}

export interface MovementResponse {
  id: UUID;
  movement_type: MovementType;
  variant_id: UUID;
  source_branch_id: UUID | null;
  destination_branch_id: UUID | null;
  quantity: number;
  reason: string | null;
  performed_by_id: UUID;
  created_at: string;
}
