import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { ICONS, NavGroup, NavItem, ROLE_META, navForRole } from './core/navigation';
import { AuthService } from './core/services/auth.service';
import { CatalogStore } from './core/services/catalog-store.service';
import { CommerceService } from './core/services/commerce.service';
import { NotificationsService } from './core/services/notifications.service';
import { SyncManagerService } from './core/services/sync-manager.service';
import { Role } from './models';
import { UiConfirmComponent } from './shared/ui/confirm-dialog.component';
import { UiIconComponent } from './shared/ui/icon.component';

const SIDEBAR_KEY = 'fashionstore_sidebar_collapsed';

/** Shell de la web (CU03-CU24): barra lateral por rol + barra superior, según el diseño web de Figma. */
@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, UiConfirmComponent, UiIconComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  /** Estado del catálogo demo (carrito, favoritos y toast del prototipo). */
  readonly catalogStore = inject(CatalogStore);
  readonly notifs = inject(NotificationsService);
  readonly syncManager = inject(SyncManagerService);

  private readonly auth = inject(AuthService);
  private readonly commerce = inject(CommerceService);
  private readonly router = inject(Router);

  readonly icons = ICONS;
  readonly user = this.auth.currentUser;

  private readonly url = signal(this.router.url);
  readonly collapsed = signal(localStorage.getItem(SIDEBAR_KEY) === '1');
  readonly userMenuOpen = signal(false);
  readonly notifsOpen = signal(false);
  readonly cartCount = signal(0);
  readonly offline = signal(typeof navigator === 'undefined' ? false : !navigator.onLine);

  readonly isStaff = computed(() => {
    const role = this.user()?.role;
    return role === Role.Administrador || role === Role.Encargado || role === Role.Cajero;
  });
  readonly isManager = computed(() => {
    const role = this.user()?.role;
    return role === Role.Administrador || role === Role.Encargado;
  });
  readonly isAdmin = computed(() => this.user()?.role === Role.Administrador);

  /** Login y registro se muestran a sangre, sin la barra pública (diseño de Figma). */
  readonly isAuthRoute = computed(() => this.url().startsWith('/auth/'));

  /** La landing pública trae su propia cabecera y ocupa todo el ancho. */
  readonly isLandingRoute = computed(() => {
    const path = this.url().split('?')[0];
    return path === '/' || path === '';
  });

  /** Etiqueta y color de la insignia de rol. */
  readonly roleMeta = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_META[role] : null;
  });

  /** Menú lateral del rol autenticado. */
  readonly navGroups = computed<NavGroup[]>(() => navForRole(this.user()?.role));

  /** Ítem de navegación activo (breadcrumb y título de la página). */
  readonly currentItem = computed<NavItem | undefined>(() => {
    const path = this.url().split('?')[0];
    return this.navGroups()
      .flatMap((group) => group.items)
      .filter((item) => path === item.path || path.startsWith(`${item.path}/`))
      .sort((a, b) => b.path.length - a.path.length)[0];
  });

  readonly currentGroup = computed(() => {
    const current = this.currentItem();
    if (!current) return '';
    return (
      this.navGroups().find((group) => group.items.some((item) => item.path === current.path))
        ?.label ?? ''
    );
  });

  readonly initials = computed(() => {
    const name = this.user()?.full_name ?? '';
    const parts = name.split(' ').filter(Boolean).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'FS';
  });

  readonly tenantName = computed(() => {
    const u = this.user();
    if (u?.tenant_name) return u.tenant_name;
    const email = u?.email?.toLowerCase() || '';
    if (email.includes('@mundomedias.com')) return 'Mundo Medias S.R.L.';
    if (email.includes('@elegance.com')) return 'Elegance Boutique S.R.L.';
    if (email.includes('@urbanstyle.com')) return 'Moda Urbana S.A.';
    return null;
  });

  readonly planName = computed(() => {
    const u = this.user();
    if (u?.plan_name) return u.plan_name;
    const email = u?.email?.toLowerCase() || '';
    if (email.includes('@urbanstyle.com') || email.includes('@tenisurbanos.com') || email.includes('@sportactive.com')) {
      return 'Plan Básico';
    }
    if (email.includes('@mundomedias.com') || email.includes('@denimco.com') || email.includes('@relaxhomewear.com')) {
      return 'Plan Profesional';
    }
    if (email.includes('@elegance.com') || email.includes('@sartoriamilan.com') || email.includes('@nordicwinter.com')) {
      return 'Plan Empresarial';
    }
    return null;
  });

  readonly tenantBadge = computed(() => {
    const tenant = this.tenantName();
    if (!tenant) return null;
    const t = tenant.toLowerCase();

    // ── PLAN BÁSICO ──
    if (t.includes('moda urbana')) {
      return {
        name: 'Moda Urbana S.A.',
        tag: 'Moda Casual & Streetwear',
        plan: this.planName() || 'Plan Básico',
        initials: 'MU',
        color: '#6366F1',
        bgColor: '#312E81',
        borderColor: '#4F46E5',
      };
    }
    if (t.includes('tenis urbanos')) {
      return {
        name: 'Tenis Urbanos S.R.L.',
        tag: 'Sneakers & Calzado Urbano',
        plan: this.planName() || 'Plan Básico',
        initials: 'TU',
        color: '#06B6D4',
        bgColor: '#164E63',
        borderColor: '#0891B2',
      };
    }
    if (t.includes('sportactive')) {
      return {
        name: 'SportActive Ropa Deportiva',
        tag: 'Ropa Fitness & Training',
        plan: this.planName() || 'Plan Básico',
        initials: 'SA',
        color: '#F97316',
        bgColor: '#7C2D12',
        borderColor: '#EA580C',
      };
    }

    // ── PLAN PROFESIONAL ──
    if (t.includes('mundo medias')) {
      return {
        name: 'Mundo Medias S.R.L.',
        tag: 'Especialista en Medias',
        plan: this.planName() || 'Plan Profesional',
        initials: 'MM',
        color: '#10B981',
        bgColor: '#064E3B',
        borderColor: '#059669',
      };
    }
    if (t.includes('denim co')) {
      return {
        name: 'Denim Co. Jeans Factory',
        tag: 'Jeans & Ropa de Mezclilla',
        plan: this.planName() || 'Plan Profesional',
        initials: 'DC',
        color: '#3B82F6',
        bgColor: '#1E3A8A',
        borderColor: '#2563EB',
      };
    }
    if (t.includes('relax homewear')) {
      return {
        name: 'Relax Homewear & Pijamas',
        tag: 'Ropa de Descanso & Confort',
        plan: this.planName() || 'Plan Profesional',
        initials: 'RH',
        color: '#EC4899',
        bgColor: '#831843',
        borderColor: '#DB2777',
      };
    }

    // ── PLAN EMPRESARIAL ──
    if (t.includes('elegance')) {
      return {
        name: 'Elegance Boutique S.R.L.',
        tag: 'Alta Costura & Lujo',
        plan: this.planName() || 'Plan Empresarial',
        initials: 'EB',
        color: '#F59E0B',
        bgColor: '#78350F',
        borderColor: '#D97706',
      };
    }
    if (t.includes('sartoria')) {
      return {
        name: 'Sartoria Milán Bespoke',
        tag: 'Sastrería & Trajes a Medida',
        plan: this.planName() || 'Plan Empresarial',
        initials: 'SM',
        color: '#D97706',
        bgColor: '#451A03',
        borderColor: '#B45309',
      };
    }
    if (t.includes('nordic winter')) {
      return {
        name: 'Nordic Winter & Coats',
        tag: 'Abrigos & Colección Invierno',
        plan: this.planName() || 'Plan Empresarial',
        initials: 'NW',
        color: '#38BDF8',
        bgColor: '#0C4A6E',
        borderColor: '#0284C7',
      };
    }

    return {
      name: tenant,
      tag: 'Empresa Contratante',
      plan: this.planName() || 'Tenant SaaS',
      initials: tenant.slice(0, 2).toUpperCase(),
      color: '#38BDF8',
      bgColor: '#0C4A6E',
      borderColor: '#0284C7',
    };
  });

  constructor() {
    this.auth.restoreSession().subscribe();

    // Banner «Sin conexión» (estado offline del modelo de Figma).
    window.addEventListener('online', () => this.offline.set(false));
    window.addEventListener('offline', () => this.offline.set(true));

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.url.set(event.urlAfterRedirects);
        this.userMenuOpen.set(false);
        this.notifsOpen.set(false);
        if (event.urlAfterRedirects.startsWith('/cart')) {
          this.refreshCart();
        }
      });

    // Actualiza dinámicamente el título de la pestaña según el tenant autenticado
    effect(() => {
      const tenant = this.tenantName();
      const u = this.user();
      if (tenant) {
        document.title = `${tenant} · FashionStore SaaS`;
      } else if (u?.role === Role.Superadmin) {
        document.title = 'Superadmin SaaS · FashionStore Plataforma';
      } else {
        document.title = 'FashionStore SaaS · Plataforma de Moda';
      }
    });

    // Recarga reactiva del catálogo y notificaciones al cambiar el usuario o tenant
    effect(() => {
      const u = this.user();
      this.catalogStore.refreshStock();
      this.notifs.reloadForUser(u);
    });

    // El contador del carrito solo aplica al cliente (CU10).
    effect(() => {
      if (this.user()?.role === Role.Cliente) {
        this.refreshCart();
      } else {
        this.cartCount.set(0);
      }
    });
  }

  toggleSidebar(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
    if (this.userMenuOpen()) this.notifsOpen.set(false);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  readonly isListening = signal(false);

  toggleNotifs(): void {
    this.notifsOpen.update((open) => !open);
    if (this.notifsOpen()) {
      this.userMenuOpen.set(false);
      this.syncSalesNotifs();
    }
  }

  closeNotifs(): void {
    this.notifsOpen.set(false);
  }

  syncSalesNotifs(): void {
    if (this.auth.hasToken()) {
      this.commerce.listSales().subscribe({
        next: (sales) => this.notifs.syncFromSales(sales),
        error: () => {},
      });
    }
  }

  startVoiceSearch(inputElem?: HTMLInputElement): void {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        'Tu navegador no cuenta con Web Speech API para reconocimiento de voz. Te recomendamos usar Google Chrome.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      this.isListening.set(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript ?? '';
        this.isListening.set(false);
        if (transcript.trim()) {
          if (inputElem) inputElem.value = transcript.trim();
          this.search(transcript.trim());
        }
      };

      recognition.onerror = () => {
        this.isListening.set(false);
      };

      recognition.onend = () => {
        this.isListening.set(false);
      };

      recognition.start();
    } catch {
      this.isListening.set(false);
    }
  }

  search(term: string): void {
    const query = term.trim();
    this.router.navigate(['/catalog'], query ? { queryParams: { q: query } } : {});
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/']);
  }

  private refreshCart(): void {
    this.commerce.getCart().subscribe({
      next: (cart) => this.cartCount.set(cart.items.reduce((total, item) => total + item.quantity, 0)),
      error: () => this.cartCount.set(0)
    });
  }
}

