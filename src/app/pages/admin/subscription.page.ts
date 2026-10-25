import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ICONS } from '../../core/navigation';
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
                      <span class="badge-locked">🔒 Bloqueado en Plan Básico</span>
                    }
                  </div>
                  <p class="metric-desc">
                    {{ sub.subscription?.plan?.has_ai_reports ? 'Acceso completo a reportes de lenguaje natural, predicción de demanda y exportaciones.' : 'Actualiza al Plan Profesional para desbloquear analítica generativa.' }}
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
                [class.is-pro]="plan.name === 'Profesional'"
              >
                @if (plan.name === 'Profesional') {
                  <div class="popular-ribbon">Recomendado</div>
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
                </ul>

                <div class="card-action">
                  @if (subscription()?.subscription?.plan?.name === plan.name) {
                    <button class="btn btn-current" disabled>Plan Actual</button>
                  } @else {
                    <button
                      class="btn btn-switch"
                      [disabled]="switching()"
                      (click)="changePlan(plan.name)"
                    >
                      {{ switching() ? 'Cambiando...' : (plan.name === 'Profesional' ? 'Mejorar a Profesional' : 'Cambiar a Básico') }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
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
    .btn-switch {
      background: #4f46e5;
      color: #ffffff;
    }
    .btn-switch:hover:not(:disabled) {
      background: #4338ca;
    }
  `]
})
export class SubscriptionPage implements OnInit {
  private readonly saasService = inject(SaasService);
  private readonly notifs = inject(NotificationsService);

  readonly subscription = signal<TenantResponse | null>(null);
  readonly plans = signal<PlanResponse[]>([]);
  readonly loading = signal(true);
  readonly switching = signal(false);
  readonly icons = ICONS;

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

  changePlan(planName: string): void {
    if (!confirm(`¿Estás seguro de cambiar al Plan ${planName}?`)) return;

    this.switching.set(true);
    this.saasService.changePlan(planName).subscribe({
      next: (tenant) => {
        this.notifs.success(`Plan actualizado con éxito al Plan ${planName}`);
        this.subscription.set(tenant);
        this.switching.set(false);
      },
      error: (err) => {
        this.notifs.error(err.error?.detail || 'Error al cambiar de plan');
        this.switching.set(false);
      }
    });
  }
}
