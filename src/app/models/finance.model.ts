import { ID } from './common.model';

export enum FeeType {
  Cuota = 'cuota',
  Expensa = 'expensa'
}

export enum PaymentMethod {
  Tarjeta = 'tarjeta',
  Transferencia = 'transferencia',
  Efectivo = 'efectivo'
}

export enum FineStatus {
  Pendiente = 'pendiente',
  Pagada = 'pagada',
  Anulada = 'anulada'
}

export interface FeeCreate {
  fee_type: FeeType;
  period: string;
  concept: string;
  amount: number;
  due_date?: string;
  description?: string;
}

export type FeeUpdate = Partial<FeeCreate>;

export interface FeeResponse {
  id: ID;
  fee_type: FeeType;
  period: string;
  concept: string;
  amount: number;
  due_date: string | null;
  description: string | null;
  created_by_id: ID;
  created_at: string;
}

export interface PaymentCreate {
  fee_id: ID;
  amount: number;
  method?: PaymentMethod;
}

export interface PaymentResponse {
  id: ID;
  fee_id: ID;
  user_id: ID;
  amount: number;
  method: PaymentMethod;
  status: string;
  reference: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface FineCreate {
  user_id: ID;
  fee_id?: ID;
  reason: string;
  amount: number;
}

export interface FineUpdate {
  reason?: string;
  amount?: number;
  status?: FineStatus;
}

export interface FineResponse {
  id: ID;
  user_id: ID;
  fee_id: ID | null;
  reason: string;
  amount: number;
  status: FineStatus;
  issued_at: string;
  paid_at: string | null;
  created_at: string;
}

export interface FeeLedgerItem {
  id: ID;
  fee_type: FeeType;
  period: string;
  concept: string;
  amount: number;
  due_date: string | null;
  collected: number;
  pending: number;
}

export interface FinancialSummary {
  period: string;
  total_fees: number;
  total_amount: number;
  total_collected: number;
  total_pending: number;
  fine_total: number;
  collection_rate: number;
}

export interface FinancialReportResponse {
  summary: FinancialSummary;
  fees: FeeLedgerItem[];
  fines: FineResponse[];
}