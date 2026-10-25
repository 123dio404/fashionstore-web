import { Id } from './common.model';

// ── SAAS & MULTITENANT (PAQ-01 / PAQ-02) ──

export interface PlanResponse {
  id: Id;
  name: string;
  max_branches: number;
  has_ai_reports: boolean;
  monthly_price: number;
  is_active: boolean;
}

export interface SubscriptionResponse {
  id: Id;
  tenant_id: Id;
  plan_id: Id;
  start_date: string;
  end_date: string | null;
  status: string;
  plan: PlanResponse | null;
}

export interface ChangePlanRequest {
  plan_name: string;
}

export interface TenantResponse {
  id: Id;
  name: string;
  tax_id: string | null;
  slug: string;
  status: string;
  created_at: string;
  active_branches_count: number;
  subscription: SubscriptionResponse | null;
}

export interface TenantCreateRequest {
  name: string;
  slug: string;
  tax_id: string | null;
  plan_name: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
}

// ── OPERACIONES OFFLINE & IDEMPOTENCIA (PAQ-04) ──

export type OfflineOperationType = 'venta' | 'reserva';
export type OfflineSyncStatus = 'LOCAL' | 'ENVIADO' | 'CONFIRMADO' | 'DUPLICADO_IDEMPOTENTE' | 'CONFLICTO';

export interface OfflineQueueItem {
  id?: number;
  uuid: string;
  tipo: OfflineOperationType;
  datos: any;
  fecha: string;
  estado: OfflineSyncStatus;
  mensaje_servidor?: string;
  error?: string;
}

export interface SyncBatchResponse {
  total_recibidas: number;
  confirmadas: number;
  duplicadas_idempotentes: number;
  conflictos: number;
  resultados: Array<{
    uuid: string;
    tipo: string;
    estado: OfflineSyncStatus;
    mensaje: string;
    id_servidor?: number;
    motivo_conflicto?: string;
  }>;
}

// ── POLÍTICAS POSTVENTA: CAMBIO DE PRENDAS (PAQ-05) ──

export interface GarmentExchangeRequest {
  branch_id: Id;
  original_sale_id: Id;
  returned_variant_id: Id;
  new_variant_id: Id;
  reason?: string;
}

export interface GarmentExchangeResponse {
  id: Id;
  voucher_number: string;
  tenant_id: Id;
  branch_id: Id;
  branch_name?: string;
  original_sale_id: Id;
  returned_variant_id: Id;
  returned_product_name?: string;
  new_variant_id: Id;
  new_product_name?: string;
  price_difference: number;
  reason: string;
  created_at: string;
  created_by_name?: string;
}

// ── ANALÍTICA CON MACHINE LEARNING (PAQ-06) ──

export interface MlModelMetric {
  name: string;
  algorithm: string;
  trained: boolean;
  trained_at: string | null;
  metrics: Record<string, any>;
}

export interface MlStatusResponse {
  supervised_demand_model: MlModelMetric;
  unsupervised_clustering_model: MlModelMetric;
}

export interface DemandForecastDay {
  fecha: string;
  dia_semana: string;
  es_fin_de_semana: boolean;
  demanda_estimada_unidades: number;
  ingresos_proyectados_bs: number;
  stock_seguridad_recomendado: number;
}

export interface DemandProjectionItem {
  sucursal_id: Id;
  sucursal_nombre: string;
  categoria_id: Id;
  categoria_nombre: string;
  precio_promedio_bs: number;
  stock_disponible_actual: number;
  demanda_total_proyectada: number;
  ingresos_totales_proyectados_bs: number;
  alerta_desabastecimiento: boolean;
  deficit_unidades_estimado: number;
  pronostico_diario: DemandForecastDay[];
}

export interface StockRiskAlert {
  sucursal: string;
  categoria: string;
  stock_actual: number;
  demanda_esperada: number;
  unidades_sugeridas_reorden: number;
}

export interface DemandPredictionResponse {
  tenant_id: Id;
  dias_pronostico: number;
  total_sucursales_evaluadas: number;
  total_categorias_evaluadas: number;
  alertas_riesgo_stock: StockRiskAlert[];
  proyecciones: DemandProjectionItem[];
}

export interface CustomerSegmentSummary {
  segmento_key: string;
  nombre: string;
  color: string;
  total_clientes: number;
  porcentaje: number;
  recencia_promedio_dias: number;
  frecuencia_promedio: number;
  gasto_promedio_bs: number;
  descripcion: string;
  estrategia_recomendada: string;
}

export interface CustomerSegmentsResponse {
  tenant_id: Id;
  algoritmo: string;
  silhouette_score: number;
  segment_distribution: CustomerSegmentSummary[];
  estrategias_recomendadas: Array<{
    segmento: string;
    color: string;
    accion: string;
  }>;
}

export interface MlDashboardResponse {
  timestamp: string;
  tenant_id: Id;
  status: MlStatusResponse;
  top_demand_categories: Array<{ categoria: string; demanda_estimada: number }>;
  stock_risk_alerts: StockRiskAlert[];
  proyecciones_resumen: DemandProjectionItem[];
  segmentacion_clientes: CustomerSegmentsResponse;
}

// ── REPORTES GENERATIVOS CON IA (PAQ-07) ──

export interface AiReportResponse {
  tipo_reporte: 'ventas_sucursal' | 'top_productos' | 'comparativa_trimestral' | 'riesgo_stock' | 'personalizado';
  titulo: string;
  tipo_grafico: 'barras' | 'lineas' | 'dona' | 'tabla';
  columnas: string[];
  filas: Array<Record<string, any>>;
  datos_grafico: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
      fill?: boolean;
    }>;
  };
  prompt_original?: string;
  empresa: string;
  tenant_id: Id;
  resumen_ejecutivo: string;
  generado_en: string;
}
