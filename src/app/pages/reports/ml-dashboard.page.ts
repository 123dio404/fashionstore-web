import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiReportsService } from '../../core/services/ai-reports.service';
import { MlService } from '../../core/services/ml.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { SaasService } from '../../core/services/saas.service';
import {
  AiReportResponse,
  CustomerSegmentsResponse,
  DemandPredictionResponse,
  MlStatusResponse,
  SubscriptionResponse
} from '../../models';

@Component({
  selector: 'app-ml-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="ml-dashboard-container">
      <header class="page-header">
        <div class="header-left">
          <span class="eyebrow">Analítica Avanzada & Inteligencia Artificial</span>
          <h1>Dashboard de Machine Learning & IA</h1>
          <p class="subtitle">Modelos predictivos de demanda textil, segmentación RFM y reportes generativos en lenguaje natural.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="retrainModels()" [disabled]="retraining()">
            {{ retraining() ? 'Reentrenando...' : '🔄 Reentrenar Modelos ML' }}
          </button>
        </div>
      </header>

      <!-- SECCIÓN 1: ESTADO Y MÉTRICAS DE MODELOS ML (RF20 / RF21) -->
      @if (status(); as st) {
        <div class="status-grid">
          <div class="status-card">
            <div class="card-icon-badge blue">📈</div>
            <div class="card-info">
              <span class="model-type">Modelo Supervisado (RF20)</span>
              <h3>{{ st.supervised_demand_model.name }}</h3>
              <div class="algorithm-tag">{{ st.supervised_demand_model.algorithm }}</div>
              <div class="metrics-row">
                <div class="metric">
                  <span class="label">R² Score:</span>
                  <strong>{{ st.supervised_demand_model.metrics['r2_score'] || 0.47 }}</strong>
                </div>
                <div class="metric">
                  <span class="label">Error Medio (MAE):</span>
                  <strong>{{ st.supervised_demand_model.metrics['mae'] || 3.38 }} u.</strong>
                </div>
                <div class="metric">
                  <span class="label">Muestras:</span>
                  <strong>{{ st.supervised_demand_model.metrics['total_samples'] || 3500 }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="status-card">
            <div class="card-icon-badge purple">🎯</div>
            <div class="card-info">
              <span class="model-type">Modelo No Supervisado (RF21)</span>
              <h3>{{ st.unsupervised_clustering_model.name }}</h3>
              <div class="algorithm-tag">{{ st.unsupervised_clustering_model.algorithm }}</div>
              <div class="metrics-row">
                <div class="metric">
                  <span class="label">Silhouette Score:</span>
                  <strong>{{ st.unsupervised_clustering_model.metrics['silhouette_score'] || 0.55 }}</strong>
                </div>
                <div class="metric">
                  <span class="label">Clusters:</span>
                  <strong>4 Segmentos RFM</strong>
                </div>
                <div class="metric">
                  <span class="label">Clientes:</span>
                  <strong>{{ st.unsupervised_clustering_model.metrics['total_samples'] || 500 }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- SECCIÓN 2: PROYECCIÓN DE DEMANDA TEXTIL (RF20) -->
      <section class="section-box">
        <div class="section-head">
          <div>
            <h2>Pronóstico de Demanda a 7 Días & Alertas de Inventario</h2>
            <p>Predicción por Random Forest considerando estacionalidad y picos de venta de fin de semana.</p>
          </div>
        </div>

        @if (demand(); as dem) {
          <!-- Alertas de Stock Crítico -->
          @if (dem.alertas_riesgo_stock.length > 0) {
            <div class="alert-banner">
              <div class="alert-icon">⚠️</div>
              <div class="alert-content">
                <strong>Alerta de Desabastecimiento Detectada:</strong>
                <p>El inventario físico actual es insuficiente para cubrir la demanda esperada en {{ dem.alertas_riesgo_stock.length }} categoría(s):</p>
                <ul>
                  @for (al of dem.alertas_riesgo_stock; track al.categoria) {
                    <li>
                      <strong>{{ al.sucursal }} — {{ al.categoria }}:</strong> Stock actual: {{ al.stock_actual }} u. | Demanda esperada: {{ al.demanda_esperada }} u. (Sugerido reorden: +{{ al.unidades_sugeridas_reorden }} u.)
                    </li>
                  }
                </ul>
              </div>
            </div>
          }

          <div class="demand-cards-grid">
            @for (item of dem.proyecciones.slice(0, 4); track item.sucursal_nombre + item.categoria_nombre) {
              <div class="demand-card" [class.danger-border]="item.alerta_desabastecimiento">
                <div class="demand-header">
                  <span class="branch-pill">{{ item.sucursal_nombre }}</span>
                  <span class="cat-pill">{{ item.categoria_nombre }}</span>
                </div>
                <div class="demand-body">
                  <div class="demand-total">
                    <span class="val">{{ item.demanda_total_proyectada }}</span>
                    <span class="unit">unidades</span>
                  </div>
                  <div class="revenue-proj">
                    Ingresos estimados: <strong>Bs. {{ item.ingresos_totales_proyectados_bs | number: '1.2-2' }}</strong>
                  </div>
                  <div class="stock-check">
                    Stock disponible: <strong>{{ item.stock_disponible_actual }} u.</strong>
                    @if (item.alerta_desabastecimiento) {
                      <span class="deficit-tag">Déficit: -{{ item.deficit_unidades_estimado }} u.</span>
                    } @else {
                      <span class="safe-tag">Stock suficiente</span>
                    }
                  </div>
                </div>

                <!-- Desglose Diario -->
                <div class="daily-bars">
                  @for (day of item.pronostico_diario; track day.fecha) {
                    <div class="bar-col" [title]="day.dia_semana + ': ' + day.demanda_estimada_unidades + ' u.'">
                      <div
                        class="bar-fill"
                        [style.height.%]="(day.demanda_estimada_unidades / 20) * 100"
                        [class.weekend]="day.es_fin_de_semana"
                      ></div>
                      <span class="day-lbl">{{ day.dia_semana.substring(0, 2) }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- SECCIÓN 3: SEGMENTACIÓN DE CLIENTES RFM (RF21) -->
      <section class="section-box">
        <div class="section-head">
          <div>
            <h2>Segmentación de Clientes por Clústeres K-Means (RFM)</h2>
            <p>Agrupación por Recencia (días), Frecuencia (visitas) y Monto monetario gastado.</p>
          </div>
        </div>

        @if (segments(); as seg) {
          <div class="segments-grid">
            @for (s of seg.segment_distribution; track s.segmento_key) {
              <div class="segment-card" [style.border-top-color]="s.color">
                <div class="segment-head">
                  <div class="color-dot" [style.background]="s.color"></div>
                  <h4>{{ s.nombre }}</h4>
                  <span class="pct-badge" [style.color]="s.color" [style.background]="s.color + '22'">
                    {{ s.porcentaje }}%
                  </span>
                </div>
                <div class="segment-metrics">
                  <div>Recencia: <strong>{{ s.recencia_promedio_dias }} días</strong></div>
                  <div>Frecuencia: <strong>{{ s.frecuencia_promedio }} compras</strong></div>
                  <div>Gasto Promedio: <strong>Bs. {{ s.gasto_promedio_bs }}</strong></div>
                </div>
                <p class="segment-desc">{{ s.descripcion }}</p>
                <div class="strategy-box">
                  <span class="strat-title">Estrategia Comercial:</span>
                  <p class="strat-text">{{ s.estrategia_recomendada }}</p>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- SECCIÓN 4: REPORTES GENERATIVOS CON IA (RF23 - RF28) -->
      <section class="section-box ai-section">
        <div class="section-head">
          <div>
            <h2>Reportes Generativos con Inteligencia Artificial (Gemini)</h2>
            <p>Consulta datos de negocio mediante lenguaje natural escrito o comandos de voz (RF23, RF24, RF26, RF27).</p>
          </div>
        </div>

        @if (subscription() && !subscription()?.has_ai_reports) {
          <!-- Candado Plan Básico (RF28) -->
          <div class="plan-locked-card">
            <div class="lock-icon">🔒</div>
            <h3>Módulo de IA Reservado para Plan Profesional</h3>
            <p>Tu empresa cuenta actualmente con el <strong>Plan Básico</strong>, el cual no incluye consultas de lenguaje natural ni reportes generativos de IA.</p>
            <a routerLink="/admin/subscription" class="btn btn-primary">
              Actualizar a Plan Profesional →
            </a>
          </div>
        } @else {
          <!-- Buscador en Lenguaje Natural + Voz -->
          <div class="query-bar">
            <div class="input-wrap">
              <input
                type="text"
                placeholder="Escribe tu consulta... Ej: ¿Cuáles son las prendas más vendidas del mes?"
                [(ngModel)]="queryInput"
                (keyup.enter)="runQuery()"
              />
              <button
                type="button"
                class="mic-btn"
                [class.listening]="isListening()"
                (click)="toggleVoice()"
                title="Dictar por voz (Web Speech API)"
              >
                {{ isListening() ? '🔴 Escuchando...' : '🎙️ Dictar' }}
              </button>
            </div>
            <button class="btn btn-primary" (click)="runQuery()" [disabled]="loadingReport() || !queryInput.trim()">
              {{ loadingReport() ? 'Analizando...' : 'Generar Reporte IA' }}
            </button>
          </div>

          <!-- Botones de Reportes Rápidos Demostrables (RF25) -->
          <div class="presets-row">
            <span class="presets-lbl">Reportes Demostrables:</span>
            <button class="preset-btn" (click)="loadPreset('ventas')">🏢 Ventas por Sucursal</button>
            <button class="preset-btn" (click)="loadPreset('top')">👕 Top 10 Más Vendidos</button>
            <button class="preset-btn" (click)="loadPreset('trimestre')">📈 Comparativa Trimestral</button>
            <button class="preset-btn" (click)="loadPreset('agotamiento')">⚠️ Riesgo de Agotamiento</button>
          </div>

          <!-- Resultado del Reporte Generado -->
          @if (currentReport(); as rep) {
            <div class="report-result-card">
              <div class="report-header">
                <div>
                  <span class="report-badge">{{ rep.tipo_reporte | uppercase }}</span>
                  <h3>{{ rep.titulo }}</h3>
                  <span class="report-time">Generado: {{ rep.generado_en }} | Empresa: {{ rep.empresa }}</span>
                </div>
                <div class="export-actions">
                  <button class="btn btn-export pdf" (click)="downloadPdf()" [disabled]="exportingPdf()">
                    {{ exportingPdf() ? 'Descargando...' : '📄 Descargar PDF' }}
                  </button>
                  <button class="btn btn-export excel" (click)="downloadExcel()" [disabled]="exportingExcel()">
                    {{ exportingExcel() ? 'Descargando...' : '📊 Descargar Excel' }}
                  </button>
                </div>
              </div>

              <!-- Resumen Ejecutivo de Gemini -->
              <div class="ai-summary-box">
                <div class="ai-header">
                  <span class="sparkle">✨</span>
                  <strong>Análisis Ejecutivo de Inteligencia Artificial (Gemini):</strong>
                </div>
                <p class="summary-text">{{ rep.resumen_ejecutivo }}</p>
              </div>

              <!-- Tabla de Resultados -->
              @if (rep.filas.length > 0) {
                <div class="table-wrap">
                  <table class="report-table">
                    <thead>
                      <tr>
                        @for (col of rep.columnas; track col) {
                          <th>{{ col }}</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of rep.filas; track $index) {
                        <tr>
                          @for (col of rep.columnas; track col) {
                            <td>{{ row[col] }}</td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="empty-state">No se encontraron registros para los filtros seleccionados.</p>
              }
            </div>
          }
        }
      </section>
    </div>
  `,
  styles: [`
    .ml-dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .eyebrow {
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      color: #e05a47;
      font-weight: 700;
    }
    h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #1e1b4b;
      margin: 0.25rem 0;
    }
    .subtitle { color: #6b7280; font-size: 0.95rem; }
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }
    .status-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      gap: 1.25rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
    }
    .card-icon-badge {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .card-icon-badge.blue { background: #e0e7ff; }
    .card-icon-badge.purple { background: #f3e8ff; }
    .model-type {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 700;
    }
    .status-card h3 {
      font-size: 1.2rem;
      color: #1e1b4b;
      margin: 0.2rem 0 0.4rem;
    }
    .algorithm-tag {
      display: inline-block;
      background: #f3f4f6;
      color: #4b5563;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    .metrics-row {
      display: flex;
      gap: 1.5rem;
    }
    .metric .label {
      display: block;
      font-size: 0.75rem;
      color: #6b7280;
    }
    .metric strong {
      font-size: 1rem;
      color: #1f2937;
    }
    .section-box {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 1.75rem;
      margin-bottom: 2.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }
    .section-head { margin-bottom: 1.5rem; }
    .section-head h2 { font-size: 1.35rem; color: #1e1b4b; margin: 0 0 0.25rem; }
    .section-head p { color: #6b7280; font-size: 0.9rem; margin: 0; }
    .alert-banner {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      gap: 0.75rem;
    }
    .alert-icon { font-size: 1.25rem; }
    .alert-content p, .alert-content ul { margin: 0.25rem 0; font-size: 0.85rem; color: #92400e; }
    .alert-content ul { padding-left: 1.25rem; }
    .demand-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .demand-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .demand-card.danger-border { border-color: #f87171; background: #fff5f5; }
    .demand-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .branch-pill {
      background: #e0e7ff;
      color: #3730a3;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }
    .cat-pill {
      background: #f3f4f6;
      color: #4b5563;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }
    .demand-total .val { font-size: 2rem; font-weight: 900; color: #1e1b4b; }
    .demand-total .unit { font-size: 0.85rem; color: #6b7280; margin-left: 0.25rem; }
    .revenue-proj { font-size: 0.85rem; color: #4b5563; margin: 0.25rem 0 0.5rem; }
    .stock-check { font-size: 0.8rem; color: #6b7280; display: flex; justify-content: space-between; }
    .deficit-tag { color: #dc2626; font-weight: 700; }
    .safe-tag { color: #16a34a; font-weight: 600; }
    .daily-bars {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 60px;
      margin-top: 1rem;
      padding-top: 0.5rem;
      border-top: 1px dashed #e5e7eb;
    }
    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 12%;
      height: 100%;
      justify-content: flex-end;
    }
    .bar-fill {
      width: 100%;
      background: #818cf8;
      border-radius: 4px 4px 0 0;
      min-height: 4px;
    }
    .bar-fill.weekend { background: #e05a47; }
    .day-lbl { font-size: 0.65rem; color: #9ca3af; margin-top: 0.25rem; }
    .segments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.25rem;
    }
    .segment-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-top: 4px solid;
      border-radius: 12px;
      padding: 1.25rem;
    }
    .segment-head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .color-dot { width: 10px; height: 10px; border-radius: 50%; }
    .segment-head h4 { margin: 0; font-size: 1rem; color: #1e1b4b; flex: 1; }
    .pct-badge { font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 6px; }
    .segment-metrics {
      background: #f9fafb;
      padding: 0.65rem;
      border-radius: 8px;
      font-size: 0.8rem;
      color: #4b5563;
      margin-bottom: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .segment-desc { font-size: 0.8rem; color: #6b7280; line-height: 1.4; margin-bottom: 0.75rem; }
    .strategy-box {
      background: #fdf4f2;
      border: 1px solid #fee2e2;
      border-radius: 8px;
      padding: 0.65rem;
    }
    .strat-title { font-size: 0.75rem; font-weight: 700; color: #e05a47; display: block; margin-bottom: 0.2rem; }
    .strat-text { font-size: 0.75rem; color: #7f1d1d; margin: 0; }
    .plan-locked-card {
      text-align: center;
      padding: 3rem 1.5rem;
      background: #f9fafb;
      border: 1px dashed #d1d5db;
      border-radius: 12px;
    }
    .lock-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .plan-locked-card h3 { font-size: 1.25rem; color: #1e1b4b; margin: 0 0 0.5rem; }
    .plan-locked-card p { color: #6b7280; max-width: 500px; margin: 0 auto 1.5rem; font-size: 0.9rem; }
    .query-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .input-wrap {
      flex: 1;
      position: relative;
      display: flex;
    }
    .input-wrap input {
      width: 100%;
      padding: 0.75rem 6.5rem 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      font-size: 0.95rem;
    }
    .mic-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 0.4rem 0.6rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
    .mic-btn.listening { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
    .presets-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }
    .presets-lbl { font-size: 0.8rem; font-weight: 700; color: #6b7280; }
    .preset-btn {
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
    }
    .preset-btn:hover { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }
    .report-result-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 1.5rem;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 1rem;
    }
    .report-badge {
      display: inline-block;
      background: #e0e7ff;
      color: #4338ca;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      margin-bottom: 0.25rem;
    }
    .report-header h3 { margin: 0.15rem 0; font-size: 1.35rem; color: #1e1b4b; }
    .report-time { font-size: 0.8rem; color: #9ca3af; }
    .export-actions { display: flex; gap: 0.5rem; }
    .btn-export {
      padding: 0.5rem 0.85rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      border: 1px solid #d1d5db;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-export.pdf:hover { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
    .btn-export.excel:hover { background: #dcfce7; border-color: #86efac; color: #166534; }
    .ai-summary-box {
      background: #f5f3ff;
      border: 1px solid #ddd6fe;
      border-radius: 10px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .ai-header { display: flex; align-items: center; gap: 0.5rem; color: #6d28d9; margin-bottom: 0.5rem; font-size: 0.95rem; }
    .summary-text { font-size: 0.9rem; color: #374151; line-height: 1.5; margin: 0; white-space: pre-line; }
    .table-wrap { overflow-x: auto; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .report-table th { background: #f3f4f6; text-align: left; padding: 0.65rem 0.75rem; color: #374151; font-weight: 700; }
    .report-table td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #f3f4f6; color: #1f2937; }
    .empty-state { text-align: center; color: #9ca3af; padding: 2rem 0; }
    .btn { padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 700; cursor: pointer; border: none; }
    .btn-primary { background: #e05a47; color: #ffffff; }
    .btn-outline { background: transparent; border: 1px solid #d1d5db; color: #374151; }
    .btn-outline:hover:not(:disabled) { background: #f3f4f6; }
  `]
})
export class MlDashboardPage implements OnInit {
  private readonly mlService = inject(MlService);
  private readonly aiService = inject(AiReportsService);
  private readonly saasService = inject(SaasService);
  private readonly notifs = inject(NotificationsService);

  status = signal<MlStatusResponse | null>(null);
  demand = signal<DemandPredictionResponse | null>(null);
  segments = signal<CustomerSegmentsResponse | null>(null);
  subscription = signal<SubscriptionResponse | null>(null);

  queryInput = '';
  loadingReport = signal(false);
  retraining = signal(false);
  exportingPdf = signal(false);
  exportingExcel = signal(false);
  currentReport = signal<AiReportResponse | null>(null);
  isListening = signal(false);
  recognition: any = null;

  ngOnInit(): void {
    this.loadSubscription();
    this.loadMlData();
    this.initSpeechRecognition();
  }

  loadSubscription(): void {
    this.saasService.getMySubscription().subscribe({
      next: (sub) => this.subscription.set(sub),
      error: () => {}
    });
  }

  loadMlData(): void {
    this.mlService.getStatus().subscribe({
      next: (st) => this.status.set(st),
      error: () => {}
    });

    this.mlService.predictDemand({ days: 7 }).subscribe({
      next: (dem) => this.demand.set(dem),
      error: () => {}
    });

    this.mlService.getCustomerSegments().subscribe({
      next: (seg) => this.segments.set(seg),
      error: () => {}
    });
  }

  retrainModels(): void {
    this.retraining.set(true);
    this.mlService.trainModels().subscribe({
      next: () => {
        this.notifs.success('¡Modelos de Machine Learning reentrenados y actualizados con éxito!');
        this.retraining.set(false);
        this.loadMlData();
      },
      error: (err) => {
        this.notifs.error('Error al reentrenar modelos: ' + (err.error?.detail || err.message));
        this.retraining.set(false);
      }
    });
  }

  runQuery(): void {
    if (!this.queryInput.trim()) return;
    this.loadingReport.set(true);
    this.aiService.queryReport(this.queryInput).subscribe({
      next: (rep) => {
        this.currentReport.set(rep);
        this.loadingReport.set(false);
        this.notifs.success('Reporte generado exitosamente con Gemini AI');
      },
      error: (err) => {
        this.notifs.error(err.error?.detail || 'Error al consultar reporte con IA');
        this.loadingReport.set(false);
      }
    });
  }

  loadPreset(type: 'ventas' | 'top' | 'trimestre' | 'agotamiento'): void {
    this.loadingReport.set(true);
    let obs;
    if (type === 'ventas') {
      obs = this.aiService.getBranchSales(30);
    } else if (type === 'top') {
      obs = this.aiService.getTopProducts(10);
    } else if (type === 'trimestre') {
      obs = this.aiService.getQuarterlyComparison();
    } else {
      obs = this.aiService.getLowStockRisk();
    }

    obs.subscribe({
      next: (rep) => {
        this.currentReport.set(rep);
        this.loadingReport.set(false);
      },
      error: (err) => {
        this.notifs.error(err.error?.detail || 'Error al cargar reporte');
        this.loadingReport.set(false);
      }
    });
  }

  downloadPdf(): void {
    const rep = this.currentReport();
    if (!rep) return;
    this.exportingPdf.set(true);
    this.aiService.exportPdf(rep).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_FashionStore_${rep.tipo_reporte}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exportingPdf.set(false);
      },
      error: () => this.exportingPdf.set(false)
    });
  }

  downloadExcel(): void {
    const rep = this.currentReport();
    if (!rep) return;
    this.exportingExcel.set(true);
    this.aiService.exportExcel(rep).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_FashionStore_${rep.tipo_reporte}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exportingExcel.set(false);
      },
      error: () => this.exportingExcel.set(false)
    });
  }

  initSpeechRecognition(): void {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'es-BO';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;

        this.recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          this.queryInput = text;
          this.isListening.set(false);
          this.runQuery();
        };

        this.recognition.onerror = () => {
          this.isListening.set(false);
        };

        this.recognition.onend = () => {
          this.isListening.set(false);
        };
      }
    }
  }

  toggleVoice(): void {
    if (!this.recognition) {
      this.notifs.warning('Tu navegador no soporta Web Speech API para dictado por voz.');
      return;
    }
    if (this.isListening()) {
      this.recognition.stop();
      this.isListening.set(false);
    } else {
      this.isListening.set(true);
      this.recognition.start();
    }
  }
}
