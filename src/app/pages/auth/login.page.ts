import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import { ICONS } from '../../core/navigation';
import { AuthService } from '../../core/services/auth.service';
import { BranchesService } from '../../core/services/branches.service';
import { ProductsService } from '../../core/services/products.service';
import { Role } from '../../models';
import { UiIconComponent } from '../../shared/ui/icon.component';

/** Portal de acceso del diseño web (Figma Make v8): cliente, administración y punto de venta. */
interface Portal {
  id: 'cliente' | 'admin' | 'pos';
  label: string;
  hint: string;
  icon: string | string[];
  /** Pantalla donde aterriza el portal (igual que el prototipo). */
  home: string;
  /** Roles del sistema que entran por este portal. */
  roles: Role[];
}

const PORTALS: Portal[] = [
  {
    id: 'cliente',
    label: 'Cliente',
    hint: 'Comprar y gestionar pedidos',
    icon: ICONS.user,
    home: '/catalog',
    roles: [Role.Cliente]
  },
  {
    id: 'admin',
    label: 'Administrador / SaaS',
    hint: 'Gestión de tienda y plataforma SaaS',
    icon: ICONS.settings,
    home: '/reports/dashboard',
    roles: [Role.Superadmin, Role.Administrador, Role.Encargado]
  },
  {
    id: 'pos',
    label: 'Punto de Venta',
    hint: 'Terminal y cobros en tienda',
    icon: ICONS.terminal,
    home: '/pos',
    roles: [Role.Cajero]
  }
];

export interface DemoAccount {
  label: string;
  roleText: string;
  email: string;
  portal: 'cliente' | 'admin' | 'pos';
}

export interface DemoTenant {
  name: string;
  shortName: string;
  plan: string;
  color: string;
  accounts: DemoAccount[];
}

export const DEMO_TENANTS: DemoTenant[] = [
  {
    name: 'Mundo Medias S.R.L.',
    shortName: 'Mundo Medias',
    plan: 'Plan Profesional (Tienda de Medias)',
    color: '#0284c7',
    accounts: [
      { label: 'Admin', roleText: 'Administrador', email: 'admin@mundomedias.com', portal: 'admin' },
      { label: 'Cajero', roleText: 'Punto de Venta', email: 'cajero@mundomedias.com', portal: 'pos' },
      { label: 'Cliente', roleText: 'Cliente Tienda', email: 'cliente@mundomedias.com', portal: 'cliente' }
    ]
  },
  {
    name: 'Moda Urbana S.A.',
    shortName: 'Moda Urbana',
    plan: 'Plan Básico (Ropa Urbana)',
    color: '#e05a47',
    accounts: [
      { label: 'Admin', roleText: 'Administrador', email: 'admin@urbanstyle.com', portal: 'admin' },
      { label: 'Cajero', roleText: 'Punto de Venta', email: 'cajero@urbanstyle.com', portal: 'pos' },
      { label: 'Cliente', roleText: 'Cliente Tienda', email: 'cliente@urbanstyle.com', portal: 'cliente' }
    ]
  },
  {
    name: 'Elegance Boutique S.R.L.',
    shortName: 'Elegance',
    plan: 'Plan Empresarial (Alta Costura e IA)',
    color: '#7c3aed',
    accounts: [
      { label: 'Admin', roleText: 'Administrador', email: 'admin@elegance.com', portal: 'admin' },
      { label: 'Cajero', roleText: 'Punto de Venta', email: 'cajero@elegance.com', portal: 'pos' },
      { label: 'Cliente', roleText: 'Cliente Tienda', email: 'cliente@elegance.com', portal: 'cliente' }
    ]
  },
  {
    name: 'FashionStore SaaS Global',
    shortName: 'SaaS Global',
    plan: 'Administración Global de la Plataforma',
    color: '#334155',
    accounts: [
      { label: 'Superadmin', roleText: 'Superadmin SaaS', email: 'superadmin@fashionstore.com', portal: 'admin' },
      { label: 'Cliente', roleText: 'Cliente General', email: 'cliente@fashionstore.com', portal: 'cliente' }
    ]
  }
];

/** CU02 — Iniciar sesión: panel de marca + selector de portal + acceso rápido para evaluación SaaS. */
@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, UiIconComponent],
  templateUrl: './login.page.html',
  styles: [`
    .demo-box {
      margin-bottom: 1.25rem;
      padding: 0.75rem 0.85rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }
    .demo-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .demo-badge {
      font-size: 0.65rem;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      background: #e05a47;
      color: #fff;
    }
    .demo-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
    }
    .demo-tabs {
      display: flex;
      gap: 0.25rem;
      overflow-x: auto;
      padding-bottom: 0.35rem;
      margin-bottom: 0.45rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .demo-tab-btn {
      padding: 0.25rem 0.5rem;
      font-size: 0.72rem;
      font-weight: 600;
      border-radius: 6px;
      border: 1px solid transparent;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }
    .demo-tab-btn:hover {
      background: #f1f5f9;
      color: #334155;
    }
    .demo-tab-btn.active {
      background: #fff;
      border-color: #cbd5e1;
      color: #0f172a;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .demo-content {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .demo-plan-pill {
      font-size: 0.7rem;
      font-weight: 700;
    }
    .demo-buttons {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .demo-account-btn {
      flex: 1 1 calc(33.3% - 0.4rem);
      min-width: 85px;
      padding: 0.35rem 0.5rem;
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
    }
    .demo-account-btn:hover {
      border-color: #e05a47;
      background: #fff5f5;
    }
    .acc-role {
      font-size: 0.72rem;
      font-weight: 700;
      color: #1e293b;
    }
    .acc-email {
      font-size: 0.62rem;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
    }
  `]
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly products = inject(ProductsService);
  private readonly branches = inject(BranchesService);

  readonly portals = PORTALS;
  readonly selectedPortal = signal<Portal['id']>('cliente');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly helpOpen = signal(false);
  readonly version = environment.appVersion;

  readonly demoTenants = DEMO_TENANTS;
  readonly activeDemoTenantIndex = signal(0);

  /** Cifras reales del catálogo para el panel de marca (no hay métricas inventadas). */
  readonly productCount = signal<number | null>(null);
  readonly branchCount = signal<number | null>(null);
  readonly brandCount = signal<number | null>(null);

  email = '';
  password = '';

  constructor() {
    this.products.list().subscribe({
      next: (items) => {
        const active = items.filter((item) => item.is_active);
        this.productCount.set(active.length);
        this.brandCount.set(
          new Set(active.map((item) => item.brand).filter((brand): brand is string => !!brand)).size
        );
      },
      error: () => {
        this.productCount.set(null);
        this.brandCount.set(null);
      }
    });
    this.branches.list().subscribe({
      next: (items) => this.branchCount.set(items.length),
      error: () => this.branchCount.set(null)
    });
  }

  fillDemo(acc: DemoAccount): void {
    this.email = acc.email;
    this.password = 'Admin123';
    this.selectedPortal.set(acc.portal);
    this.error.set(null);
  }

  submit(): void {
    const portal = PORTALS.find((item) => item.id === this.selectedPortal());
    if (!portal) return;

    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.email, this.password).subscribe({
      next: (session) => {
        this.loading.set(false);
        if (!portal.roles.includes(session.user.role)) {
          const expected = PORTALS.find((item) => item.roles.includes(session.user.role));
          this.auth.logout();
          this.error.set(
            expected
              ? `Esta cuenta entra como «${session.user.role}». Selecciona el portal «${expected.label}» para continuar.`
              : `El rol «${session.user.role}» no tiene portal web.`
          );
          return;
        }

        if (session.user.role === Role.Superadmin) {
          this.router.navigate(['/admin/tenants']);
          return;
        }
        this.router.navigate([portal.home]);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message);
      }
    });
  }
}
