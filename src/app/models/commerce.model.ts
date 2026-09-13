import { ID } from './common.model';

export enum CartStatus {
  Activo = 'Activo',
  Completado = 'Completado',
  Anulado = 'Anulado'
}

export enum SaleType {
  Digital = 'digital',
  Pos = 'pos'
}

export enum PaymentStatus {
  Pendiente = 'pendiente',
  Completado = 'completado',
  Fallido = 'fallido',
  Reembolsado = 'reembolsado'
}

export enum ReservationStatus {
  Pendiente = 'pendiente',
  Confirmada = 'confirmada',
  EnTienda = 'en_tienda',
  Completada = 'completada',
  Cancelada = 'cancelada'
}

export interface CartItemRequest {
  stock_id: ID;
  quantity: number;
}

export interface CartItemUpdate {
  quantity: number;
}

export interface CartItemResponse {
  id: ID;
  stock_id: ID;
  quantity: number;
  price: number;
  variant_id: ID;
  product_id: ID;
  product_name: string;
  size: string | null;
  color: string | null;
}

export interface CartResponse {
  id: ID;
  status: CartStatus;
  items: CartItemResponse[];
  total: number;
}

export interface CheckoutRequest {
  branch_id: ID;
}

export interface SaleItemInput {
  stock_id: ID;
  quantity: number;
}

export interface PosSaleCreate {
  branch_id: ID;
  client_id: ID;
  items: SaleItemInput[];
  paid?: boolean;
}

export interface SaleItemResponse {
  id: ID;
  stock_id: ID;
  quantity: number;
  unit_price: number;
}

export interface SalePaymentResponse {
  id: ID;
  sale_id: ID;
  amount: number;
  status: PaymentStatus;
  paid_at: string | null;
  reference: string | null;
}

export interface SaleResponse {
  id: ID;
  client_id: ID;
  user_id: ID | null;
  branch_id: ID;
  sale_date: string;
  total: number;
  sale_type: SaleType;
  items: SaleItemResponse[];
  payments: SalePaymentResponse[];
}

export interface ReservationItemInput {
  stock_id: ID;
  quantity: number;
}

export interface ReservationCreate {
  branch_id: ID;
  reservation_date: string;
  reservation_time: string;
  items: ReservationItemInput[];
}

export interface ReservationUpdate {
  reservation_date?: string;
  reservation_time?: string;
  status?: ReservationStatus;
}

export interface ReservationItemResponse {
  id: ID;
  stock_id: ID;
  quantity: number;
}

export interface ReservationResponse {
  id: ID;
  client_id: ID;
  branch_id: ID;
  reservation_date: string;
  reservation_time: string;
  status: ReservationStatus;
  items: ReservationItemResponse[];
}