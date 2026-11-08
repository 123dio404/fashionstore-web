import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SaasService } from '../../core/services/saas.service';
import { PlanResponse, TenantResponse } from '../../models';

/** Landing pública: presentación del servicio, planes y autoservicio para crear tienda + admin. */
@Component({
  selector: 'app-landing-page',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="landing">
      <header class="land-nav">
        <a class="land-brand" routerLink="/">
          <img src="/img/brand/logo.svg" alt="" height="32" />
          <span>FashionStore<span class="dot">.</span></span>
        </a>
        <nav class="land-links">
          <button type="button" (click)="scrollTo('producto')">Producto</button>
          <button type="button" (click)="scrollTo('planes')">Planes</button>
          <button type="button" (click)="scrollTo('como-funciona')">Cómo funciona</button>
          <a routerLink="/catalog">Catálogo</a>
        </nav>
        <div class="land-nav-actions">
          <a class="btn-ghost" routerLink="/auth/login">Iniciar sesión</a>
          <a class="btn-solid sm" routerLink="/auth/register">Crear cuenta</a>
        </div>
      </header>

      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">Plataforma SaaS multitenant para moda</span>
          <h1>
            Tu tienda de moda,
            <span class="accent">lista para vender</span>
            desde el primer día.
          </h1>
          <p class="lead">
            Inventario por variantes, ventas en varias sucursales, punto de venta offline y
            analítica con inteligencia artificial. Todo en una sola plataforma, con tu propia
            identidad y tus propios datos.
          </p>
          <div class="hero-actions">
            <button type="button" class="btn-solid lg" (click)="scrollTo('crear')">
              Crear mi tienda
              <span aria-hidden="true">→</span>
            </button>
            <button type="button" class="btn-outline lg" (click)="scrollTo('planes')">
              Ver planes
            </button>
          </div>
          <ul class="hero-checks">
            <li>✓ Alta en minutos</li>
            <li>✓ Sin tarjeta de crédito</li>
            <li>✓ Cancela cuando quieras</li>
          </ul>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="mock-window">
            <div class="mock-topbar">
              <span></span><span></span><span></span>
              <div class="mock-pill">Panel general · Mi boutique</div>
            </div>
            <div class="mock-body">
              <div class="mock-kpis">
                <div class="mock-kpi">
                  <small>Ventas del mes</small>
                  <strong>Bs. 48.250</strong>
                  <em>▲ 18,4%</em>
                </div>
                <div class="mock-kpi">
                  <small>Stock disponible</small>
                  <strong>1.248</strong>
                  <em class="neutral">unidades</em>
                </div>
                <div class="mock-kpi ai">
                  <small>IA · Demanda</small>
                  <strong>12 categorías</strong>
                  <em>predicción 7 días</em>
                </div>
              </div>
              <div class="mock-chart">
                <div class="bar" style="height: 38%"></div>
                <div class="bar" style="height: 62%"></div>
                <div class="bar" style="height: 48%"></div>
                <div class="bar" style="height: 82%"></div>
                <div class="bar" style="height: 58%"></div>
                <div class="bar" style="height: 94%"></div>
                <div class="bar" style="height: 72%"></div>
              </div>
              <div class="mock-list">
                <div class="mock-row"><span class="tag">POS</span> Venta #1042 · Bs. 320,00</div>
                <div class="mock-row"><span class="tag ok">Sincronizado</span> Sucursal Centro</div>
              </div>
            </div>
          </div>
          <div class="floating-card">
            <span class="pulse-dot"></span>
            <div>
              <strong>IA activa</strong>
              <small>Reportes en lenguaje natural</small>
            </div>
          </div>
        </div>
      </section>

      <div class="trustbar">
        <div><strong>3</strong><span>empresas ya operan en la plataforma</span></div>
        <div><strong>4</strong><span>sucursales sincronizadas</span></div>
        <div><strong>408</strong><span>variantes de producto gestionadas</span></div>
        <div><strong>24/7</strong><span>disponibilidad del panel</span></div>
      </div>

      <section class="section" id="producto">
        <div class="section-head">
          <span class="eyebrow">Todo incluido</span>
          <h2>Una plataforma para operar y hacer crecer tu tienda</h2>
          <p>
            Diseñada para boutiques y cadenas de moda que necesitan control real de su inventario,
            sus sucursales y sus números.
          </p>
        </div>

        <div class="features">
          @for (feature of features; track feature.title) {
            <article class="feature">
              <div class="feature-icon">{{ feature.icon }}</div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </article>
          }
        </div>
      </section>

      <section class="section alt" id="como-funciona">
        <div class="section-head">
          <span class="eyebrow">En 3 pasos</span>
          <h2>Crea tu tienda y empieza a vender</h2>
        </div>
        <div class="steps">
          <div class="step">
            <span class="step-num">01</span>
            <h3>Crea tu cuenta de administrador</h3>
            <p>Registra tu empresa, elige un plan y define las credenciales de tu usuario admin.</p>
          </div>
          <div class="step">
            <span class="step-num">02</span>
            <h3>Configura tu catálogo</h3>
            <p>Carga productos, variantes, tallas, colores y sucursales. Tu espacio queda aislado.</p>
          </div>
          <div class="step">
            <span class="step-num">03</span>
            <h3>Vende y analiza</h3>
            <p>Usa el POS, controla el inventario y toma decisiones con reportes e IA.</p>
          </div>
        </div>
      </section>

      <section class="section" id="planes">
        <div class="section-head">
          <span class="eyebrow">Suscripciones</span>
          <h2>Elige el plan de tu tienda</h2>
          <p>Precios mensuales en bolivianos. Cambia de plan cuando tu negocio lo necesite.</p>
        </div>

        @if (plansLoading()) {
          <div class="plans-grid">
            @for (item of [1, 2, 3]; track item) {
              <div class="plan-card skeleton"></div>
            }
          </div>
        } @else {
          <div class="plans-grid">
            @for (plan of plans(); track plan.id) {
              <article
                class="plan-card"
                [class.featured]="plan.name === 'Profesional'"
                [class.ai-plan]="plan.has_ai_reports"
              >
                @if (plan.name === 'Profesional') {
                  <span class="ribbon">Recomendado</span>
                }
                @if (plan.has_ai_reports) {
                  <span class="ribbon ai">Con IA</span>
                }

                <h3>{{ plan.name }}</h3>
                <div class="plan-price">
                  <span class="currency">Bs.</span>
                  <span class="amount">{{ plan.monthly_price | number: '1.2-2' }}</span>
                  <span class="period">/ mes</span>
                </div>
                <p class="plan-desc">
                  {{ planDescription(plan) }}
                </p>

                <ul class="plan-features">
                  <li>✓ Hasta <strong>{{ plan.max_branches }} sucursales</strong></li>
                  <li>✓ Inventario por variantes y stock por sucursal</li>
                  <li>✓ POS con soporte offline y sincronización</li>
                  <li>✓ Reportes de ventas e inventario</li>
                  <li [class.off]="!plan.has_ai_reports">
                    {{ plan.has_ai_reports ? '✓' : '✗' }} Reportes con IA (texto y voz)
                  </li>
                  <li [class.off]="!plan.has_ai_reports">
                    {{ plan.has_ai_reports ? '✓' : '✗' }} Predicción de demanda y segmentación ML
                  </li>
                </ul>

                <button type="button" class="btn-plan" (click)="choosePlan(plan.name)">
                  Elegir {{ plan.name }}
                </button>
              </article>
            }
          </div>
        }

        @if (plansFailed()) {
          <p class="plans-note">
            No se pudieron cargar los planes en vivo; se muestran los precios de referencia.
          </p>
        }
      </section>

      <section class="section create" id="crear">
        <div class="create-grid">
          <div class="create-copy">
            <span class="eyebrow">Autoservicio</span>
            <h2>Crea tu tienda y tu cuenta admin</h2>
            <p>
              Completa el formulario y tendrás tu espacio listo con el plan que elijas. Podrás
              iniciar sesión como administrador y empezar a configurar tu catálogo de inmediato.
            </p>
            <ul class="create-list">
              <li>
                <span>🏬</span>
                <div>
                  <strong>Empresa propia y aislada</strong>
                  <small>Tus datos nunca se mezclan con los de otras tiendas.</small>
                </div>
              </li>
              <li>
                <span>🔐</span>
                <div>
                  <strong>Cuenta de administrador</strong>
                  <small>Acceso al panel de gestión, reportes y configuración.</small>
                </div>
              </li>
              <li>
                <span>🚀</span>
                <div>
                  <strong>Suscripción activa</strong>
                  <small>Un año de vigencia con el plan seleccionado.</small>
                </div>
              </li>
            </ul>
          </div>

          <div class="create-card">
            @if (created(); as store) {
              <div class="success">
                <div class="success-icon">✓</div>
                <h3>¡Tu tienda está lista!</h3>
                <p>
                  <strong>{{ store.name }}</strong> fue creada con el plan
                  <strong>{{ store.subscription?.plan?.name || selectedPlan() }}</strong>.
                </p>
                <p class="success-mail">
                  Administrador: <strong>{{ form.admin_email }}</strong>
                </p>
                <a class="btn-solid full" routerLink="/auth/login">Ir a iniciar sesión →</a>
                <button type="button" class="btn-link" (click)="resetForm()">
                  Crear otra tienda
                </button>
              </div>
            } @else {
              <form (ngSubmit)="submit()" class="store-form">
                <h3>Datos de tu tienda</h3>

                @if (error()) {
                  <div class="form-error">{{ error() }}</div>
                }

                <div class="field">
                  <label for="store-name">Nombre comercial *</label>
                  <input
                    id="store-name"
                    name="store-name"
                    placeholder="Ej. Boutique Aurora"
                    [ngModel]="form.name"
                    (ngModelChange)="onNameChange($event)"
                    required
                  />
                </div>

                <div class="field">
                  <label for="store-slug">Identificador (URL) *</label>
                  <input
                    id="store-slug"
                    name="store-slug"
                    placeholder="boutique-aurora"
                    [ngModel]="form.slug"
                    (ngModelChange)="onSlugChange($event)"
                    required
                  />
                  <small>Minúsculas, números y guiones. Debe ser único.</small>
                </div>

                <div class="field-row">
                  <div class="field">
                    <label for="store-tax">NIT / documento</label>
                    <input
                      id="store-tax"
                      name="store-tax"
                      placeholder="Opcional"
                      [ngModel]="form.tax_id"
                      (ngModelChange)="form.tax_id = $event"
                    />
                  </div>
                  <div class="field">
                    <label for="store-plan">Plan *</label>
                    <select
                      id="store-plan"
                      name="store-plan"
                      [ngModel]="selectedPlan()"
                      (ngModelChange)="selectedPlan.set($event)"
                    >
                      @for (plan of plans(); track plan.id) {
                        <option [value]="plan.name">{{ plan.name }} · Bs. {{ plan.monthly_price }}</option>
                      }
                    </select>
                  </div>
                </div>

                <h3 class="form-subtitle">Tu cuenta de administrador</h3>

                <div class="field">
                  <label for="admin-name">Nombre completo *</label>
                  <input
                    id="admin-name"
                    name="admin-name"
                    placeholder="Ej. Ana Pérez"
                    [ngModel]="form.admin_name"
                    (ngModelChange)="form.admin_name = $event"
                    required
                  />
                </div>

                <div class="field">
                  <label for="admin-email">Correo electrónico *</label>
                  <input
                    id="admin-email"
                    name="admin-email"
                    type="email"
                    placeholder="admin@mitienda.com"
                    [ngModel]="form.admin_email"
                    (ngModelChange)="form.admin_email = $event"
                    required
                  />
                </div>

                <div class="field">
                  <label for="admin-password">Contraseña *</label>
                  <input
                    id="admin-password"
                    name="admin-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    [ngModel]="form.admin_password"
                    (ngModelChange)="form.admin_password = $event"
                    minlength="6"
                    required
                  />
                </div>

                <button type="submit" class="btn-solid full" [disabled]="submitting()">
                  {{ submitting() ? 'Creando tu tienda…' : 'Crear mi tienda' }}
                </button>
                <p class="legal">
                  Al crear tu tienda aceptas las condiciones del servicio. Podrás cambiar de plan
                  o cancelar cuando quieras.
                </p>
              </form>
            }
          </div>
        </div>
      </section>

      <footer class="land-footer">
        <div class="footer-brand">
          <img src="/img/brand/logo.svg" alt="" height="28" />
          <span>FashionStore SaaS</span>
        </div>
        <p>Plataforma multitenant de gestión de moda · Inventario, POS, reportes e IA.</p>
        <div class="footer-links">
          <a routerLink="/catalog">Catálogo</a>
          <a routerLink="/auth/login">Iniciar sesión</a>
          <a routerLink="/auth/register">Crear cuenta</a>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: #ffffff;
      color: #111827;
    }

    .landing {
      --ink: #111827;
      --muted: #6b7280;
      --line: #e5e7eb;
      --brand: #e05a47;
      --brand-dark: #c04838;
      --brand-soft: #fdece9;
      --indigo: #4f46e5;
      overflow-x: hidden;
    }

    /* ── Navegación ── */
    .land-nav {
      position: sticky;
      top: 0;
      z-index: 40;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0.9rem 2rem;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--line);
    }
    .land-brand {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      color: var(--ink);
      font-family: var(--font-display, Georgia, serif);
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .land-brand .dot {
      color: var(--brand);
    }
    .land-links {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-left: auto;
    }
    .land-links button,
    .land-links a {
      border: none;
      background: transparent;
      padding: 0.4rem 0.65rem;
      border-radius: 8px;
      font-size: 0.88rem;
      color: #374151;
      cursor: pointer;
      font-family: inherit;
    }
    .land-links button:hover,
    .land-links a:hover {
      background: #f3f4f6;
      color: var(--ink);
    }
    .land-nav-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-ghost {
      padding: 0.5rem 0.9rem;
      border-radius: 9px;
      font-size: 0.88rem;
      font-weight: 600;
      color: #374151;
    }
    .btn-ghost:hover {
      background: #f3f4f6;
    }
    .btn-solid,
    .btn-outline,
    .btn-plan {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      font-family: inherit;
    }
    .btn-solid {
      background: var(--brand);
      color: #fff;
      padding: 0.65rem 1.1rem;
      box-shadow: 0 8px 20px rgba(224, 90, 71, 0.28);
    }
    .btn-solid:hover:not(:disabled) {
      background: var(--brand-dark);
      transform: translateY(-1px);
    }
    .btn-solid:disabled {
      opacity: 0.65;
      cursor: progress;
    }
    .btn-solid.sm {
      padding: 0.5rem 0.9rem;
      font-size: 0.85rem;
    }
    .btn-solid.lg,
    .btn-outline.lg {
      padding: 0.85rem 1.5rem;
      font-size: 1rem;
    }
    .btn-solid.full {
      width: 100%;
      padding: 0.8rem 1rem;
      margin-top: 0.35rem;
    }
    .btn-outline {
      background: #fff;
      border-color: var(--line);
      color: var(--ink);
      padding: 0.65rem 1.1rem;
    }
    .btn-outline:hover {
      border-color: #c7cbd3;
      background: #fafafa;
    }

    /* ── Hero ── */
    .hero {
      display: grid;
      grid-template-columns: 1.05fr 1fr;
      gap: 3rem;
      align-items: center;
      max-width: 78rem;
      margin: 0 auto;
      padding: 4.5rem 2rem 3.5rem;
    }
    .eyebrow {
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--brand);
    }
    .hero h1 {
      margin: 0.75rem 0 1rem;
      font-size: clamp(2.3rem, 4vw, 3.5rem);
      line-height: 1.08;
      letter-spacing: -0.025em;
      color: var(--ink);
      font-family: var(--font-display, Georgia, serif);
      font-weight: 400;
    }
    .hero h1 .accent {
      color: var(--brand);
      font-style: italic;
    }
    .lead {
      font-size: 1.05rem;
      line-height: 1.65;
      color: var(--muted);
      max-width: 34rem;
    }
    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
      margin: 1.75rem 0 1.25rem;
    }
    .hero-checks {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      list-style: none;
      padding: 0;
      margin: 0;
      color: #4b5563;
      font-size: 0.85rem;
    }
    .hero-checks li {
      font-weight: 600;
    }

    .hero-visual {
      position: relative;
    }
    .mock-window {
      border-radius: 18px;
      background: #0f172a;
      padding: 0.85rem;
      box-shadow: 0 30px 70px rgba(15, 23, 42, 0.3);
      transform: rotate(-1.2deg);
    }
    .mock-topbar {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.35rem 0.75rem;
    }
    .mock-topbar > span {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #475569;
    }
    .mock-topbar > span:first-child { background: #f87171; }
    .mock-topbar > span:nth-child(2) { background: #fbbf24; }
    .mock-topbar > span:nth-child(3) { background: #34d399; }
    .mock-pill {
      margin-left: auto;
      font-size: 0.62rem;
      color: #cbd5e1;
      background: #1e293b;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
    }
    .mock-body {
      background: #f8fafc;
      border-radius: 12px;
      padding: 1rem;
    }
    .mock-kpis {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.6rem;
    }
    .mock-kpi {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.6rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .mock-kpi small {
      font-size: 0.58rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .mock-kpi strong {
      font-size: 0.82rem;
      color: #0f172a;
    }
    .mock-kpi em {
      font-style: normal;
      font-size: 0.6rem;
      color: #059669;
      font-weight: 700;
    }
    .mock-kpi em.neutral { color: #64748b; }
    .mock-kpi.ai {
      background: linear-gradient(135deg, #eef2ff, #faf5ff);
      border-color: #c7d2fe;
    }
    .mock-kpi.ai strong { color: #4338ca; }
    .mock-kpi.ai em { color: #7c3aed; }
    .mock-chart {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      height: 120px;
      margin: 1rem 0 0.75rem;
      padding: 0.75rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }
    .mock-chart .bar {
      flex: 1;
      border-radius: 5px 5px 0 0;
      background: linear-gradient(180deg, #f97316, #e05a47);
    }
    .mock-chart .bar:nth-child(even) {
      background: linear-gradient(180deg, #818cf8, #4f46e5);
    }
    .mock-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .mock-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.68rem;
      color: #334155;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.45rem 0.6rem;
    }
    .tag {
      font-size: 0.55rem;
      font-weight: 800;
      padding: 0.15rem 0.4rem;
      border-radius: 999px;
      background: #e0e7ff;
      color: #4338ca;
    }
    .tag.ok {
      background: #dcfce7;
      color: #15803d;
    }
    .floating-card {
      position: absolute;
      right: -0.75rem;
      bottom: -1.5rem;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 0.75rem 1rem;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
    }
    .floating-card strong {
      display: block;
      font-size: 0.8rem;
      color: var(--ink);
    }
    .floating-card small {
      font-size: 0.7rem;
      color: var(--muted);
    }
    .pulse-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.18);
    }

    /* ── Barra de confianza ── */
    .trustbar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      max-width: 78rem;
      margin: 0 auto 1rem;
      padding: 1.5rem 2rem;
      border-top: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
    }
    .trustbar div {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      text-align: center;
      border-right: 1px solid var(--line);
    }
    .trustbar div:last-child { border-right: none; }
    .trustbar strong {
      font-size: 1.6rem;
      color: var(--ink);
      font-family: var(--font-display, Georgia, serif);
    }
    .trustbar span {
      font-size: 0.78rem;
      color: var(--muted);
    }

    /* ── Secciones ── */
    .section {
      max-width: 78rem;
      margin: 0 auto;
      padding: 4.5rem 2rem;
    }
    .section.alt {
      max-width: none;
      background: #f8f9fa;
      border-top: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
    }
    .section.alt > * {
      max-width: 78rem;
      margin-left: auto;
      margin-right: auto;
    }
    .section-head {
      max-width: 46rem;
      margin-bottom: 2.5rem;
    }
    .section-head h2 {
      margin: 0.5rem 0 0.75rem;
      font-size: clamp(1.7rem, 2.6vw, 2.4rem);
      line-height: 1.15;
      letter-spacing: -0.02em;
      font-family: var(--font-display, Georgia, serif);
      font-weight: 400;
      color: var(--ink);
    }
    .section-head p {
      color: var(--muted);
      line-height: 1.65;
      margin: 0;
    }

    /* ── Features ── */
    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }
    .feature {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 1.5rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .feature:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
    }
    .feature-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--brand-soft);
      font-size: 1.25rem;
      margin-bottom: 0.9rem;
    }
    .feature h3 {
      margin: 0 0 0.45rem;
      font-size: 1.02rem;
      color: var(--ink);
      font-family: inherit;
      font-weight: 700;
    }
    .feature p {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.6;
      color: var(--muted);
    }

    /* ── Pasos ── */
    .steps {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }
    .step {
      position: relative;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 1.75rem 1.5rem;
    }
    .step-num {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--brand);
      background: var(--brand-soft);
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      margin-bottom: 0.85rem;
    }
    .step h3 {
      margin: 0 0 0.45rem;
      font-size: 1.02rem;
      font-family: inherit;
      font-weight: 700;
      color: var(--ink);
    }
    .step p {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.6;
      color: var(--muted);
    }

    /* ── Planes ── */
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      align-items: stretch;
    }
    .plan-card {
      position: relative;
      display: flex;
      flex-direction: column;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 2rem 1.6rem 1.6rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .plan-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.09);
    }
    .plan-card.featured {
      border: 2px solid var(--indigo);
      box-shadow: 0 20px 44px rgba(79, 70, 229, 0.14);
    }
    .plan-card.ai-plan {
      background: linear-gradient(180deg, #ffffff 0%, #faf5ff 100%);
    }
    .plan-card.skeleton {
      min-height: 380px;
      background: linear-gradient(90deg, #f3f4f6 25%, #e9ebef 37%, #f3f4f6 63%);
      background-size: 400% 100%;
      animation: shimmer 1.4s ease infinite;
      border: none;
    }
    @keyframes shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: 0 0; }
    }
    .ribbon {
      position: absolute;
      top: 14px;
      right: 14px;
      background: var(--indigo);
      color: #fff;
      font-size: 0.66rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
    }
    .ribbon.ai {
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
    }
    .plan-card h3 {
      margin: 0 0 0.4rem;
      font-size: 1.3rem;
      color: var(--ink);
      font-family: inherit;
      font-weight: 800;
    }
    .plan-price {
      display: flex;
      align-items: baseline;
      gap: 0.2rem;
      margin-bottom: 0.5rem;
    }
    .plan-price .currency {
      font-size: 0.95rem;
      font-weight: 700;
      color: #4338ca;
    }
    .plan-price .amount {
      font-size: 2.3rem;
      font-weight: 900;
      color: #1e1b4b;
      letter-spacing: -0.02em;
    }
    .plan-price .period {
      font-size: 0.82rem;
      color: var(--muted);
    }
    .plan-desc {
      font-size: 0.85rem;
      color: var(--muted);
      margin: 0 0 1.2rem;
      min-height: 2.4rem;
      line-height: 1.5;
    }
    .plan-features {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      font-size: 0.85rem;
      color: #374151;
    }
    .plan-features li.off {
      color: #9ca3af;
    }
    .btn-plan {
      margin-top: auto;
      width: 100%;
      padding: 0.75rem 1rem;
      background: #f3f4f6;
      color: #1f2937;
    }
    .btn-plan:hover {
      background: var(--indigo);
      color: #fff;
    }
    .plan-card.featured .btn-plan {
      background: var(--indigo);
      color: #fff;
    }
    .plan-card.featured .btn-plan:hover {
      background: #4338ca;
    }
    .plans-note {
      margin-top: 1rem;
      font-size: 0.82rem;
      color: #b45309;
    }

    /* ── Crear tienda ── */
    .create {
      padding-top: 2rem;
    }
    .create-grid {
      display: grid;
      grid-template-columns: 1fr 1.05fr;
      gap: 3rem;
      align-items: start;
      background: #f8f9fa;
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 2.5rem;
    }
    .create-copy h2 {
      margin: 0.5rem 0 0.9rem;
      font-size: clamp(1.6rem, 2.4vw, 2.2rem);
      line-height: 1.15;
      font-family: var(--font-display, Georgia, serif);
      font-weight: 400;
      color: var(--ink);
    }
    .create-copy > p {
      color: var(--muted);
      line-height: 1.65;
      margin: 0 0 1.5rem;
    }
    .create-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .create-list li {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }
    .create-list li > span {
      font-size: 1.15rem;
      line-height: 1.2;
    }
    .create-list strong {
      display: block;
      font-size: 0.9rem;
      color: var(--ink);
    }
    .create-list small {
      font-size: 0.8rem;
      color: var(--muted);
    }
    .create-card {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 1.75rem;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.07);
    }
    .store-form h3 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      font-family: inherit;
      font-weight: 800;
      color: var(--ink);
    }
    .store-form .form-subtitle {
      margin-top: 1.35rem;
      padding-top: 1.1rem;
      border-top: 1px dashed var(--line);
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-bottom: 0.9rem;
    }
    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .field label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #374151;
    }
    .field input,
    .field select {
      width: 100%;
      padding: 0.6rem 0.7rem;
      border: 1px solid #d1d5db;
      border-radius: 9px;
      font-size: 0.88rem;
      font-family: inherit;
      color: var(--ink);
      background: #fff;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .field input:focus,
    .field select:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px rgba(224, 90, 71, 0.15);
    }
    .field small {
      font-size: 0.72rem;
      color: var(--muted);
    }
    .form-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      border-radius: 9px;
      padding: 0.6rem 0.75rem;
      font-size: 0.82rem;
      margin-bottom: 1rem;
    }
    .legal {
      margin: 0.75rem 0 0;
      font-size: 0.72rem;
      color: var(--muted);
      line-height: 1.5;
    }
    .success {
      text-align: center;
      padding: 1.5rem 0.5rem;
    }
    .success-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #dcfce7;
      color: #15803d;
      font-size: 1.5rem;
      font-weight: 800;
    }
    .success h3 {
      margin: 0 0 0.6rem;
      font-size: 1.35rem;
      color: var(--ink);
      font-family: var(--font-display, Georgia, serif);
      font-weight: 400;
    }
    .success p {
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.6;
      margin: 0 0 1rem;
    }
    .success .success-mail {
      color: #374151;
    }
    .btn-link {
      margin-top: 0.85rem;
      border: none;
      background: transparent;
      color: var(--brand);
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-link:hover {
      text-decoration: underline;
    }

    /* ── Footer ── */
    .land-footer {
      border-top: 1px solid var(--line);
      padding: 2rem;
      text-align: center;
      color: var(--muted);
      font-size: 0.82rem;
    }
    .footer-brand {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--ink);
      font-family: var(--font-display, Georgia, serif);
      font-size: 1.05rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .land-footer p {
      margin: 0.35rem 0 0.9rem;
    }
    .footer-links {
      display: flex;
      justify-content: center;
      gap: 1.25rem;
    }
    .footer-links a {
      color: #374151;
      font-weight: 600;
    }
    .footer-links a:hover {
      color: var(--brand);
    }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .hero {
        grid-template-columns: 1fr;
        padding-top: 3rem;
      }
      .hero-visual {
        max-width: 34rem;
      }
      .features,
      .steps,
      .plans-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .create-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }
    @media (max-width: 760px) {
      .land-links {
        display: none;
      }
      .land-nav {
        padding: 0.8rem 1rem;
      }
      .hero,
      .section,
      .trustbar {
        padding-left: 1rem;
        padding-right: 1rem;
      }
      .hero {
        padding-top: 2.5rem;
      }
      .trustbar {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }
      .trustbar div:nth-child(2) {
        border-right: none;
      }
      .features,
      .steps,
      .plans-grid {
        grid-template-columns: 1fr;
      }
      .land-nav-actions .btn-ghost {
        display: none;
      }
      .create-grid {
        padding: 1.5rem;
      }
      .field-row {
        grid-template-columns: 1fr;
      }
      .floating-card {
        right: 0.5rem;
        bottom: -2rem;
      }
    }
  `]
})
export class LandingPage {
  private readonly saas = inject(SaasService);

  readonly plans = signal<PlanResponse[]>([]);
  readonly plansLoading = signal(true);
  readonly plansFailed = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly created = signal<TenantResponse | null>(null);
  readonly selectedPlan = signal('Profesional');

  /** Planes de referencia por si la API no responde (precios reales del catálogo). */
  private readonly fallbackPlans: PlanResponse[] = [
    { id: 1, name: 'Básico', max_branches: 2, has_ai_reports: false, monthly_price: 29.99, is_active: true },
    { id: 2, name: 'Profesional', max_branches: 5, has_ai_reports: false, monthly_price: 69.99, is_active: true },
    { id: 3, name: 'Empresarial', max_branches: 15, has_ai_reports: true, monthly_price: 129.99, is_active: true }
  ];

  readonly features = [
    {
      icon: '👗',
      title: 'Inventario por variantes',
      description: 'Productos, tallas, colores y stock por sucursal con alertas de reposición.'
    },
    {
      icon: '🏬',
      title: 'Multisucursal',
      description: 'Administra varias tiendas desde un solo panel, con límites según tu plan.'
    },
    {
      icon: '🧾',
      title: 'Punto de venta (POS)',
      description: 'Cobra rápido, registra ventas y sigue operando aunque se caiga la conexión.'
    },
    {
      icon: '📊',
      title: 'Reportes gerenciales',
      description: 'Panel general, ventas, inventario y consultas analíticas en tiempo real.'
    },
    {
      icon: '✨',
      title: 'Analítica con IA',
      description: 'Reportes en lenguaje natural, predicción de demanda y segmentación de clientes.'
    },
    {
      icon: '🔐',
      title: 'Aislamiento multitenant',
      description: 'Cada empresa ve únicamente sus datos, usuarios y configuración.'
    }
  ];

  readonly form = {
    name: '',
    slug: '',
    tax_id: '',
    admin_name: '',
    admin_email: '',
    admin_password: ''
  };

  private slugTouched = false;

  constructor() {
    this.saas.getPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans.length ? plans : this.fallbackPlans);
        this.preselectPlan(plans);
        this.plansLoading.set(false);
      },
      error: () => {
        this.plans.set(this.fallbackPlans);
        this.plansFailed.set(true);
        this.plansLoading.set(false);
      }
    });
  }

  scrollTo(id: string): void {
    if (typeof document === 'undefined') return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  choosePlan(name: string): void {
    this.selectedPlan.set(name);
    this.scrollTo('crear');
  }

  planDescription(plan: PlanResponse): string {
    if (plan.has_ai_reports) return 'Para cadenas que quieren anticipar la demanda y automatizar el análisis.';
    if (plan.name === 'Profesional') return 'El equilibrio ideal para tiendas en crecimiento con varias sucursales.';
    return 'Para boutiques que están empezando y necesitan ordenar su operación.';
  }

  onNameChange(value: string): void {
    this.form.name = value;
    if (!this.slugTouched) {
      this.form.slug = this.slugify(value);
    }
  }

  onSlugChange(value: string): void {
    this.slugTouched = true;
    this.form.slug = this.slugify(value);
  }

  submit(): void {
    this.error.set(null);
    if (!this.form.name.trim() || !this.form.slug.trim()) {
      this.error.set('Ingresa el nombre comercial y el identificador de tu tienda.');
      return;
    }
    if (!this.form.admin_name.trim() || !this.form.admin_email.trim()) {
      this.error.set('Completa el nombre y el correo del administrador.');
      return;
    }
    if (this.form.admin_password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.submitting.set(true);
    this.saas
      .registerStore({
        name: this.form.name.trim(),
        slug: this.form.slug.trim(),
        tax_id: this.form.tax_id.trim() || null,
        plan_name: this.selectedPlan(),
        admin_name: this.form.admin_name.trim(),
        admin_email: this.form.admin_email.trim(),
        admin_password: this.form.admin_password
      })
      .subscribe({
        next: (store) => {
          this.submitting.set(false);
          this.created.set(store);
          this.scrollTo('crear');
        },
        error: (err: { error?: { detail?: string }; message?: string }) => {
          this.submitting.set(false);
          this.error.set(err?.error?.detail || err?.message || 'No se pudo crear la tienda. Intenta de nuevo.');
        }
      });
  }

  resetForm(): void {
    this.created.set(null);
    this.error.set(null);
    this.form.name = '';
    this.form.slug = '';
    this.form.tax_id = '';
    this.form.admin_name = '';
    this.form.admin_email = '';
    this.form.admin_password = '';
    this.slugTouched = false;
  }

  private preselectPlan(plans: PlanResponse[]): void {
    const current = this.selectedPlan();
    if (plans.some((plan) => plan.name === current)) return;
    const preferred =
      plans.find((plan) => plan.name === 'Profesional') ??
      plans.find((plan) => plan.is_active) ??
      plans[0];
    if (preferred) this.selectedPlan.set(preferred.name);
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }
}
