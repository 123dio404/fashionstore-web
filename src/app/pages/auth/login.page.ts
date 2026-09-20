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
    label: 'Administrador',
    hint: 'Gestión completa de la tienda',
    icon: ICONS.settings,
    home: '/reports/dashboard',
    roles: [Role.Administrador, Role.Encargado]
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

/** CU02 — Iniciar sesión: panel de marca + selector de portal, según el prototipo de Figma. */
@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, UiIconComponent],
  templateUrl: './login.page.html'
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
        this.router.navigate([portal.home]);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message);
      }
    });
  }
}
