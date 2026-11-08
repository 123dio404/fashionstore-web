import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ICONS } from '../../core/navigation';
import { AuthService } from '../../core/services/auth.service';
import { CommerceService } from '../../core/services/commerce.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { SaasService } from '../../core/services/saas.service';
import { PlanResponse, TenantResponse } from '../../models';
import { UiIconComponent } from '../../shared/ui/icon.component';

@Component({
  selector: 'app-subscription-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="saas-container">
      <header class="page-header">
        <div class="header-left">
          <span class="eyebrow">Gestión SaaS & Multitenant</span>
          <h1>Planes y Suscripción</h1>
          <p class="subtitle">Administra los límites operativos de sucursales y el acceso a Inteligencia Artificial para tu empresa.</p>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando información de suscripción...</p>
        </div>
      } @else {
        <!-- Tarjeta de Suscripción Actual -->
        @if (subscription(); as sub) {
          <div class="current-sub-card" [class.pro]="sub.subscription?.plan?.has_ai_reports">
            <div class="card-glow"></div>
            <div class="sub-header">
              <div class="tenant-badge">
                <span class="dot"></span>
                Empresa: <strong>{{ sub.name }}</strong>
              </div>
              <span class="status-pill active">{{ sub.subscription?.status || 'Sin suscripción' }}</span>
            </div>

            <div class="sub-content">
              <div class="plan-hero">
                <span class="plan-label">Plan Actual</span>
                <h2>Plan {{ sub.subscription?.plan?.name || 'Sin plan' }}</h2>
                <div class="price">
                  <span class="currency">Bs.</span>
                  <span class="amount">{{ sub.subscription?.plan?.monthly_price ?? '—' }}</span>
                  <span class="period">/ mes</span>
                </div>
                <p class="metric-desc" style="margin-top: 0.5rem">
                  Vigencia:
                  {{ sub.subscription?.start_date | date: 'dd/MM/yyyy' }}
                  —
                  {{
                    sub.subscription?.end_date
                      ? (sub.subscription?.end_date | date: 'dd/MM/yyyy')
                      : 'sin vencimiento'
                  }}
                </p>
              </div>

              <div class="sub-metrics">
                <div class="metric-box">
                  <span class="metric-label">Límite de Sucursales</span>
                  <div class="metric-val">
                    <strong>{{ sub.active_branches_count }}</strong> / {{ sub.subscription?.plan?.max_branches ?? '—' }} permitidas
                  </div>
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      [style.width.%]="branchUsage(sub)"
                      [class.danger]="isAtBranchLimit(sub)"
                    ></div>
                  </div>
                  @if (isAtBranchLimit(sub)) {
                    <span class="limit-warn">⚠️ Has alcanzado el límite máximo de sucursales de tu plan.</span>
                  }
                </div>

                <div class="metric-box">
                  <span class="metric-label">Módulo de IA Generativa & ML</span>
                  <div class="metric-val">
                    @if (sub.subscription?.plan?.has_ai_reports) {
                      <span class="badge-success">✨ Habilitado (Gemini 2.0 + ML)</span>
                    } @else {
                      <span class="badge-locked">🔒 Bloqueado (Requiere Plan Profesional o Empresarial)</span>
                    }
                  </div>
                  <p class="metric-desc">
                    {{ sub.subscription?.plan?.has_ai_reports ? 'Acceso completo a reportes de lenguaje natural, predicción de demanda y analítica avanzada.' : 'Actualiza al Plan Profesional (Bs. 69.99/mes) o Plan Empresarial (Bs. 129.99/mes) para desbloquear analítica predictiva y generativa con IA.' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Catálogo de Planes Disponibles -->
        <div class="plans-section">
          <h3>Comparativa de Planes SaaS</h3>
          <div class="plans-grid">
            @for (plan of plans(); track plan.id) {
              <div
                class="plan-card"
                [class.is-current]="subscription()?.subscription?.plan?.name === plan.name"
                [class.is-pro]="plan.name === 'Profesional' || plan.name === 'Empresarial'"
              >
                @if (plan.name === 'Profesional') {
                  <div class="popular-ribbon">Recomendado</div>
                }
                @if (plan.name === 'Empresarial') {
                  <div class="popular-ribbon" style="background: linear-gradient(135deg, #7c3aed, #4f46e5);">Empresarial · IA</div>
                }

                <div class="plan-head">
                  <h4>{{ plan.name }}</h4>
                  <div class="card-price">
                    <span class="num">Bs. {{ plan.monthly_price }}</span>
                    <span class="unit">/mes</span>
                  </div>
                </div>

                <ul class="features-list">
                  <li>
                    <span class="check">✓</span>
                    <span>Hasta <strong>{{ plan.max_branches }} sucursales físicas</strong></span>
                  </li>
                  <li>
                    <span class="check">✓</span>
                    <span>Soporte PWA e IndexedDB offline con sincronización</span>
                  </li>
                  <li>
                    <span class="check">✓</span>
                    <span>Gestión de cambios de prendas (< 30 días)</span>
                  </li>
                  <li [class.disabled]="!plan.has_ai_reports">
                    <span class="check">{{ plan.has_ai_reports ? '✓' : '✗' }}</span>
                    <span>Reportes generativos con IA (texto y voz)</span>
                  </li>
                  <li [class.disabled]="!plan.has_ai_reports">
                    <span class="check">{{ plan.has_ai_reports ? '✓' : '✗' }}</span>
                    <span>Predicción de demanda y segmentación RFM (ML)</span>
                  </li>
                  <li [class.disabled]="!plan.has_ai_reports">
                    <span class="check">{{ plan.has_ai_reports ? '✓' : '✗' }}</span>
                    <span>Exportación instantánea a PDF y Excel</span>
                  </li>
                  <li [class.disabled]="plan.name !== 'Empresarial'">
                    <span class="check">{{ plan.name === 'Empresarial' ? '✓' : '✗' }}</span>
                    <span>Expansión nacional multi-ciudad (hasta 15 sedes) y soporte 24/7</span>
                  </li>
                </ul>

                <div class="card-action">
                  @if (subscription()?.subscription?.plan?.name === plan.name) {
                    <button class="btn btn-renew" (click)="openPaymentModal(plan)">
                      💳 Renovar o Extender
                    </button>
                  } @else {
                    <button
                      class="btn btn-switch"
                      [disabled]="switching()"
                      (click)="openPaymentModal(plan)"
                    >
                      Elegir Plan {{ plan.name }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- MODAL DE PAGO PASARELA STRIPE (TARJETA & QR) -->
        @if (showPaymentModal() && selectedPlan()) {
          <div class="modal-backdrop" (click)="closePaymentModal()">
            <div class="payment-modal" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <div>
                  <span class="gateway-tag">
                    <span class="lock-icon">🔒</span> Pasarela de Pagos Stripe · Certificada
                  </span>
                  <h3>Contratación de Suscripción SaaS</h3>
                </div>
                <button type="button" class="btn-close" (click)="closePaymentModal()">✕</button>
              </div>

              <div class="modal-body">
                <!-- Resumen del Plan -->
                <div class="plan-summary-box">
                  <div class="plan-info">
                    <span class="plan-badge">Plan {{ selectedPlan()?.name }}</span>
                    <h4>{{ selectedPlan()?.name === 'Básico' ? 'Ideal para iniciar una tienda de ropa' : (selectedPlan()?.name === 'Profesional' ? 'Crecimiento multitienda y analítica con IA' : 'Corporativo con sucursales ilimitadas y Gemini Pro') }}</h4>
                    <p class="plan-specs">
                      ✓ Hasta {{ selectedPlan()?.max_branches }} sucursales · 
                      {{ selectedPlan()?.has_ai_reports ? '✨ Módulo IA Gemini Habilitado' : 'Sin módulo IA' }}
                    </p>
                  </div>
                  <div class="plan-rate">
                    <span class="unit-price">Bs. {{ selectedPlan()?.monthly_price }} / mes</span>
                  </div>
                </div>

                <!-- Selector de Ciclo de Facturación -->
                <div class="section-group">
                  <label class="section-label">Selecciona el Período a Contratar:</label>
                  <div class="months-selector">
                    <button
                      type="button"
                      class="month-btn"
                      [class.active]="selectedMonths() === 1"
                      (click)="setMonths(1)"
                    >
                      <span class="m-title">1 Mes</span>
                      <span class="m-price">Bs. {{ calculatePrice(1) }}</span>
                    </button>
                    <button
                      type="button"
                      class="month-btn"
                      [class.active]="selectedMonths() === 3"
                      (click)="setMonths(3)"
                    >
                      <span class="m-title">3 Meses</span>
                      <span class="m-price">Bs. {{ calculatePrice(3) }}</span>
                    </button>
                    <button
                      type="button"
                      class="month-btn"
                      [class.active]="selectedMonths() === 6"
                      (click)="setMonths(6)"
                    >
                      <span class="m-ribbon">10% OFF</span>
                      <span class="m-title">6 Meses</span>
                      <span class="m-price">Bs. {{ calculatePrice(6) }}</span>
                    </button>
                    <button
                      type="button"
                      class="month-btn"
                      [class.active]="selectedMonths() === 12"
                      (click)="setMonths(12)"
                    >
                      <span class="m-ribbon best">15% OFF</span>
                      <span class="m-title">12 Meses</span>
                      <span class="m-price">Bs. {{ calculatePrice(12) }}</span>
                    </button>
                  </div>
                </div>

                <!-- Métodos de Pago Stripe -->
                <div class="section-group">
                  <label class="section-label">Selecciona Método de Pago (Pasarela Stripe):</label>
                  <div class="method-tabs">
                    <button
                      type="button"
                      class="tab-btn"
                      [class.active]="paymentMethod() === 'card'"
                      (click)="setPaymentMethod('card')"
                    >
                      <span class="icon">💳</span>
                      <span>Tarjeta de Crédito / Débito (Stripe)</span>
                    </button>
                    <button
                      type="button"
                      class="tab-btn"
                      [class.active]="paymentMethod() === 'qr'"
                      (click)="setPaymentMethod('qr')"
                    >
                      <span class="icon">📱</span>
                      <span>Stripe QR (Simple Interoperable Bolivia)</span>
                    </button>
                  </div>

                  <!-- Formulario Tarjeta -->
                  @if (paymentMethod() === 'card') {
                    <div class="card-checkout-form">
                      <div class="form-row">
                        <label>Número de Tarjeta</label>
                        <div class="input-with-brands">
                          <input
                            type="text"
                            [value]="cardNumber()"
                            (input)="cardNumber.set($any($event.target).value)"
                            placeholder="4242 •••• •••• 4242"
                          />
                          <span class="brands">VISA · MASTERCARD</span>
                        </div>
                      </div>
                      <div class="form-grid-2">
                        <div>
                          <label>Vencimiento (MM/AA)</label>
                          <input
                            type="text"
                            [value]="cardExpiry()"
                            (input)="cardExpiry.set($any($event.target).value)"
                            placeholder="12/28"
                          />
                        </div>
                        <div>
                          <label>CVC / CVV</label>
                          <input
                            type="text"
                            [value]="cardCvc()"
                            (input)="cardCvc.set($any($event.target).value)"
                            placeholder="123"
                          />
                        </div>
                      </div>
                      <div class="form-row">
                        <label>Titular de la Tarjeta</label>
                        <input
                          type="text"
                          [value]="cardHolder()"
                          (input)="cardHolder.set($any($event.target).value)"
                          placeholder="Nombre y Apellidos"
                        />
                      </div>
                    </div>
                  }

                  <!-- Visualización QR -->
                  @if (paymentMethod() === 'qr') {
                    <div class="qr-checkout-view">
                      @if (loadingQr()) {
                        <div class="qr-loading">
                          <div class="spinner"></div>
                          <p>Generando código QR dinámico de Stripe...</p>
                        </div>
                      } @else if (qrCodeBase64()) {
                        <div class="qr-display-box">
                          <img [src]="'data:image/png;base64,' + qrCodeBase64()" alt="Código QR de Pago Stripe" class="qr-img" />
                          <div class="qr-instructions">
                            <span class="qr-badge">Escanea con tu App Bancaria</span>
                            <p>Compatible con cualquier banco de Bolivia (BNB, BCP, Banco Unión, Mercantil, GanaMóvil).</p>
                            <span class="qr-amount">Monto exacto: <strong>Bs. {{ totalAmount() }}</strong></span>
                          </div>
                        </div>
                      } @else {
                        <div class="qr-error-box">
                          <p>No se pudo renderizar el QR. Puedes reintentar o pagar con tarjeta.</p>
                          <button type="button" class="btn btn-secondary-sm" (click)="generateQr()">Reintentar QR</button>
                        </div>
                      }
                    </div>
                  }
                </div>

                @if (paymentError()) {
                  <div class="error-banner">
                    ⚠️ {{ paymentError() }}
                  </div>
                }

                <!-- Total y Acción -->
                <div class="checkout-footer">
                  <div class="total-col">
                    <span class="total-label">Total a Facturar:</span>
                    <span class="total-val">Bs. {{ totalAmount() }}</span>
                  </div>
                  <div class="btn-actions">
                    <button type="button" class="btn btn-cancel" (click)="closePaymentModal()">Cancelar</button>
                    <button
                      type="button"
                      class="btn btn-pay"
                      [disabled]="processingPayment()"
                      (click)="processPayment()"
                    >
                      @if (processingPayment()) {
                        <span class="btn-spinner"></span>
                        <span>Procesando con Stripe...</span>
                      } @else {
                        <span>Confirmar Pago de Bs. {{ totalAmount() }}</span>
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .saas-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    .page-header {
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
    .subtitle {
      color: #6b7280;
      font-size: 0.95rem;
    }
    .loading-state {
      text-align: center;
      padding: 4rem 1rem;
      color: #6b7280;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e5e7eb;
      border-top-color: #e05a47;
      border-radius: 50%;
      margin: 0 auto 1rem;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .current-sub-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 1.75rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      margin-bottom: 2.5rem;
      position: relative;
      overflow: hidden;
    }
    .current-sub-card.pro {
      border-color: #818cf8;
      background: linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%);
    }
    .sub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .tenant-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #f3f4f6;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      color: #374151;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
    }
    .status-pill.active {
      background: #dcfce7;
      color: #15803d;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
    }
    .sub-content {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 2rem;
    }
    @media (max-width: 768px) {
      .sub-content { grid-template-columns: 1fr; }
    }
    .plan-hero .plan-label {
      font-size: 0.8rem;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
    }
    .plan-hero h2 {
      font-size: 1.75rem;
      color: #1e1b4b;
      margin: 0.25rem 0 0.5rem;
    }
    .price {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }
    .price .currency { font-weight: 700; font-size: 1.1rem; color: #4338ca; }
    .price .amount { font-size: 2.2rem; font-weight: 900; color: #4338ca; }
    .price .period { color: #6b7280; font-size: 0.9rem; }
    .sub-metrics {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .metric-box {
      background: #ffffff;
      padding: 1.15rem;
      border-radius: 12px;
      border: 1px solid #f3f4f6;
    }
    .metric-label {
      font-size: 0.8rem;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
    }
    .metric-val {
      font-size: 1rem;
      margin: 0.35rem 0;
      color: #1f2937;
    }
    .progress-bar {
      height: 8px;
      background: #f3f4f6;
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 0.5rem;
    }
    .progress-fill {
      height: 100%;
      background: #4f46e5;
      border-radius: 9999px;
      transition: width 0.4s ease;
    }
    .progress-fill.danger { background: #ef4444; }
    .limit-warn {
      display: block;
      margin-top: 0.5rem;
      color: #dc2626;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .badge-success { color: #047857; font-weight: 700; }
    .badge-locked { color: #b45309; font-weight: 700; }
    .metric-desc {
      font-size: 0.8rem;
      color: #6b7280;
      margin: 0.25rem 0 0;
    }
    .plans-section h3 {
      font-size: 1.3rem;
      color: #1e1b4b;
      margin-bottom: 1.25rem;
    }
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .plan-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 2rem;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .plan-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.07);
    }
    .plan-card.is-pro {
      border-color: #6366f1;
      border-width: 2px;
    }
    .popular-ribbon {
      position: absolute;
      top: 14px;
      right: 14px;
      background: #6366f1;
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
    }
    .plan-head h4 {
      font-size: 1.4rem;
      color: #1e1b4b;
      margin: 0 0 0.5rem;
    }
    .card-price .num {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1f2937;
    }
    .card-price .unit {
      color: #6b7280;
      font-size: 0.85rem;
      margin-left: 0.25rem;
    }
    .features-list {
      list-style: none;
      padding: 0;
      margin: 1.5rem 0 2rem;
    }
    .features-list li {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.9rem;
      color: #374151;
      margin-bottom: 0.75rem;
    }
    .features-list li.disabled {
      color: #9ca3af;
      text-decoration: line-through;
    }
    .features-list .check {
      color: #10b981;
      font-weight: 800;
    }
    .features-list li.disabled .check {
      color: #d1d5db;
    }
    .btn {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-current {
      background: #f3f4f6;
      color: #9ca3af;
      cursor: not-allowed;
    }
    .btn-renew {
      background: #10b981;
      color: #ffffff;
    }
    .btn-renew:hover {
      background: #059669;
    }
    .btn-switch {
      background: #4f46e5;
      color: #ffffff;
    }
    .btn-switch:hover:not(:disabled) {
      background: #4338ca;
    }

    /* MODAL DE PAGOS STRIPE */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .payment-modal {
      background: #ffffff;
      border-radius: 20px;
      max-width: 620px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid #e2e8f0;
      animation: modalIn 0.2s ease-out;
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.5rem 1.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .gateway-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #6366f1;
      background: #eef2ff;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      margin-bottom: 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .modal-header h3 {
      font-size: 1.35rem;
      color: #0f172a;
      margin: 0;
      font-weight: 800;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem;
    }
    .btn-close:hover { color: #1e293b; }
    .modal-body {
      padding: 1.5rem 1.75rem;
    }
    .plan-summary-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }
    .plan-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 800;
      color: #4f46e5;
      background: #e0e7ff;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .plan-info h4 {
      margin: 0.25rem 0;
      font-size: 1rem;
      color: #1e293b;
    }
    .plan-specs {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0;
    }
    .unit-price {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }
    .section-group {
      margin-bottom: 1.5rem;
    }
    .section-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 0.6rem;
    }
    .months-selector {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }
    .month-btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 0.75rem 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
    }
    .month-btn:hover {
      border-color: #6366f1;
      background: #f8fafc;
    }
    .month-btn.active {
      border-color: #6366f1;
      background: #eef2ff;
      box-shadow: 0 0 0 2px #6366f1;
    }
    .m-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #1e293b;
    }
    .m-price {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.2rem;
    }
    .m-ribbon {
      position: absolute;
      top: -8px;
      font-size: 0.65rem;
      font-weight: 800;
      background: #10b981;
      color: #ffffff;
      padding: 0.1rem 0.4rem;
      border-radius: 9999px;
    }
    .m-ribbon.best {
      background: #f59e0b;
    }
    .method-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      font-size: 0.85rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active {
      border-color: #4f46e5;
      background: #4f46e5;
      color: #ffffff;
    }
    .card-checkout-form {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
    }
    .form-row {
      margin-bottom: 0.75rem;
    }
    .form-row label, .form-grid-2 label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      margin-bottom: 0.3rem;
      text-transform: uppercase;
    }
    .card-checkout-form input {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      background: #ffffff;
      outline: none;
      box-sizing: border-box;
    }
    .card-checkout-form input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
    .input-with-brands {
      position: relative;
    }
    .brands {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.65rem;
      font-weight: 800;
      color: #94a3b8;
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .qr-checkout-view {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }
    .qr-display-box {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      text-align: left;
    }
    .qr-img {
      width: 150px;
      height: 150px;
      border-radius: 10px;
      border: 2px solid #e2e8f0;
      background: #ffffff;
      padding: 6px;
    }
    .qr-instructions {
      flex: 1;
    }
    .qr-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 800;
      color: #059669;
      background: #d1fae5;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.4rem;
    }
    .qr-instructions p {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0.25rem 0 0.5rem;
      line-height: 1.4;
    }
    .qr-amount {
      display: block;
      font-size: 0.95rem;
      color: #0f172a;
    }
    .qr-loading {
      padding: 2rem 0;
      color: #64748b;
      font-size: 0.85rem;
    }
    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    .checkout-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid #f1f5f9;
    }
    .total-col {
      display: flex;
      flex-direction: column;
    }
    .total-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .total-val {
      font-size: 1.6rem;
      font-weight: 900;
      color: #4f46e5;
    }
    .btn-actions {
      display: flex;
      gap: 0.75rem;
    }
    .btn-cancel {
      width: auto;
      background: #f1f5f9;
      color: #475569;
      padding: 0.75rem 1.25rem;
    }
    .btn-pay {
      width: auto;
      background: #4f46e5;
      color: #ffffff;
      padding: 0.75rem 1.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-pay:hover:not(:disabled) {
      background: #4338ca;
    }
    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
  `]
})
export class SubscriptionPage implements OnInit {
  private readonly saasService = inject(SaasService);
  private readonly commerce = inject(CommerceService);
  private readonly notifs = inject(NotificationsService);
  private readonly auth = inject(AuthService);

  readonly subscription = signal<TenantResponse | null>(null);
  readonly plans = signal<PlanResponse[]>([]);
  readonly loading = signal(true);
  readonly switching = signal(false);
  readonly icons = ICONS;

  // Modal de Pago Pasarela Stripe
  readonly showPaymentModal = signal(false);
  readonly selectedPlan = signal<PlanResponse | null>(null);
  readonly selectedMonths = signal<number>(1);
  readonly paymentMethod = signal<'card' | 'qr'>('card');
  readonly qrCodeBase64 = signal<string | null>(null);
  readonly loadingQr = signal(false);
  readonly paymentError = signal<string | null>(null);
  readonly processingPayment = signal(false);

  // Formulario de Tarjeta Stripe
  readonly cardNumber = signal('4242 •••• •••• 4242');
  readonly cardExpiry = signal('12/28');
  readonly cardCvc = signal('123');
  readonly cardHolder = signal('Administrador de Tienda');

  readonly totalAmount = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return 0;
    const price = Number(plan.monthly_price) || 0;
    const months = this.selectedMonths();
    const subtotal = price * months;
    if (months === 12) return Number((subtotal * 0.85).toFixed(2));
    if (months === 6) return Number((subtotal * 0.90).toFixed(2));
    return Number(subtotal.toFixed(2));
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.saasService.getMySubscription().subscribe({
      next: (sub) => {
        this.subscription.set(sub);
        this.saasService.getPlans().subscribe({
          next: (plans) => {
            this.plans.set(plans);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: (err) => {
        this.notifs.error('No se pudo cargar la suscripción: ' + (err.error?.detail || err.message));
        this.loading.set(false);
      }
    });
  }

  branchUsage(tenant: TenantResponse): number {
    const maxBranches = tenant.subscription?.plan?.max_branches;
    return maxBranches ? Math.min(tenant.active_branches_count / maxBranches * 100, 100) : 0;
  }

  isAtBranchLimit(tenant: TenantResponse): boolean {
    const maxBranches = tenant.subscription?.plan?.max_branches;
    return maxBranches !== undefined && tenant.active_branches_count >= maxBranches;
  }

  openPaymentModal(plan: PlanResponse): void {
    this.selectedPlan.set(plan);
    this.selectedMonths.set(1);
    this.paymentMethod.set('card');
    this.paymentError.set(null);
    this.qrCodeBase64.set(null);
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
    this.selectedPlan.set(null);
    this.qrCodeBase64.set(null);
  }

  setMonths(months: number): void {
    this.selectedMonths.set(months);
    if (this.paymentMethod() === 'qr') {
      this.generateQr();
    }
  }

  calculatePrice(months: number): string {
    const plan = this.selectedPlan();
    if (!plan) return '0.00';
    const price = Number(plan.monthly_price) || 0;
    const subtotal = price * months;
    if (months === 12) return (subtotal * 0.85).toFixed(2);
    if (months === 6) return (subtotal * 0.90).toFixed(2);
    return subtotal.toFixed(2);
  }

  setPaymentMethod(method: 'card' | 'qr'): void {
    this.paymentMethod.set(method);
    this.paymentError.set(null);
    if (method === 'qr' && !this.qrCodeBase64()) {
      this.generateQr();
    }
  }

  generateQr(): void {
    this.loadingQr.set(true);
    this.commerce.createQrPayment({
      amount: this.totalAmount(),
      currency: 'bob',
      description: `Suscripción SaaS Plan ${this.selectedPlan()?.name}`
    }).subscribe({
      next: (res) => {
        this.qrCodeBase64.set(res.qr_code_base64);
        this.loadingQr.set(false);
      },
      error: () => {
        this.loadingQr.set(false);
      }
    });
  }

  processPayment(): void {
    const plan = this.selectedPlan();
    if (!plan) return;

    this.processingPayment.set(true);
    this.paymentError.set(null);

    // Simulación de procesamiento en pasarela Stripe
    setTimeout(() => {
      this.saasService.changePlan(plan.name, { months: this.selectedMonths() }).subscribe({
        next: (tenant) => {
          this.processingPayment.set(false);
          this.showPaymentModal.set(false);
          this.notifs.success(`¡Pago aprobado por Stripe! Tu empresa activó el Plan ${plan.name} por ${this.selectedMonths()} mes(es).`);
          this.subscription.set(tenant);
          this.notifs.fetchFromBackend();
          this.auth.getCurrentUser().subscribe();
        },
        error: (err) => {
          this.processingPayment.set(false);
          this.paymentError.set(err.error?.detail || 'Error al procesar el pago con Stripe');
        }
      });
    }, 1200);
  }

  changePlan(planName: string): void {
    const targetPlan = this.plans().find(p => p.name === planName);
    if (targetPlan) {
      this.openPaymentModal(targetPlan);
    }
  }
}
