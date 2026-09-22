import { Id } from './common.model';

export enum CartStatus {
  Activo = 'activo',
  Completado = 'completado',
  Anulado = 'anulado'
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
  Preparacion = 'preparacion',
  Lista = 'lista',
  Asignada = 'asignada',
  EnProbador = 'en_probador',
  Checkout = 'checkout',
  EnTienda = 'en_tienda',
  Completada = 'completada',
  Cancelada = 'cancelada',
  Reembolsada = 'reembolsada',
  Devuelta = 'devuelta'
}

export interface CartItemRequest {
  stock_id: Id;
  quantity: number;
}

export interface CartItemUpdate {
  quantity: number;
}

export interface CartItemResponse {
  id: Id;
  stock_id: Id;
  quantity: number;
  price: number;
  variant_id: Id;
  product_id: Id;
  product_name: string;
  size: string | null;
  color: string | null;
}

export interface CartResponse {
  id: Id;
  status: CartStatus;
  items: CartItemResponse[];
  total: number;
}

export interface CheckoutRequest {
  branch_id: Id;
  payment_provider?: string;
  payment_status?: PaymentStatus;
  payment_reference?: string | null;
  idempotency_key?: string | null;
}

export interface SaleItemInput {
  stock_id: Id;
  quantity: number;
}

export interface PosSaleCreate {
  branch_id: Id;
  client_id: Id;
  items: SaleItemInput[];
  paid?: boolean;
  payment_provider?: string;
  payment_status?: PaymentStatus | null;
  payment_reference?: string | null;
}

export interface SaleItemResponse {
  id: Id;
  stock_id: Id;
  quantity: number;
  unit_price: number;
}

export interface SalePaymentResponse {
  id: Id;
  sale_id: Id;
  amount: number;
  status: PaymentStatus;
  paid_at: string | null;
  reference: string | null;
}

export interface SaleResponse {
  id: Id;
  client_id: Id;
  user_id: Id | null;
  branch_id: Id;
  sale_date: string;
  total: number;
  sale_type: SaleType;
  items: SaleItemResponse[];
  payments: SalePaymentResponse[];
}

export interface ReceiptResponse {
  sale_id: Id;
  receipt_number: string;
  invoice_number: string;
  sale_date: string;
  sale_type: SaleType;
  branch_id: Id;
  client_id: Id;
  subtotal: number;
  total: number;
  payment_status: PaymentStatus;
  items: SaleItemResponse[];
}

/** CU11 — documento fiscal simulado de una venta (`POST /commerce/sales/{id}/invoice`). */
export interface InvoiceResponse {
  provider: string;
  invoice_number: string;
  sale_id: Id;
  issued_at: string;
  issuer_name: string;
  issuer_tax_id: string | null;
  customer_id: Id;
  tax_rate: number;
  subtotal: number;
  tax: number;
  total: number;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  disclaimer: string;
}

export interface ReservationItemInput {
  stock_id: Id;
  quantity: number;
}

export interface ReservationCreate {
  branch_id: Id;
  reservation_date: string;
  reservation_time: string;
  items: ReservationItemInput[];
}

export interface ReservationUpdate {
  reservation_date?: string;
  reservation_time?: string;
  status?: ReservationStatus;
  fitting_room?: number | null;
}

export interface ReservationItemResponse {
  id: Id;
  stock_id: Id;
  quantity: number;
}

export interface ReservationResponse {
  id: Id;
  client_id: Id;
  branch_id: Id;
  reservation_date: string;
  reservation_time: string;
  status: ReservationStatus;
  fitting_room: number | null;
  prepared_at: string | null;
  assigned_at: string | null;
  checked_out_at: string | null;
  refunded_at: string | null;
  items: ReservationItemResponse[];
}
