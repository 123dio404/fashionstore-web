import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { ICONS, NavGroup, NavItem, ROLE_META, navForRole } from './core/navigation';
import { AuthService } from './core/services/auth.service';
import { CommerceService } from './core/services/commerce.service';
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
  private readonly auth = inject(AuthService);
  private readonly commerce = inject(CommerceService);
  private readonly router = inject(Router);

  readonly icons = ICONS;
  readonly user = this.auth.currentUser;

  private readonly url = signal(this.router.url);
  readonly collapsed = signal(localStorage.getItem(SIDEBAR_KEY) === '1');
  readonly userMenuOpen = signal(false);
  readonly cartCount = signal(0);

  readonly isStaff = computed(() => {
    const role = this.user()?.role;
    return role === Role.Administrador || role === Role.Encargado || role === Role.Cajero;
  });
  readonly isManager = computed(() => {
    const role = this.user()?.role;
    return role === Role.Administrador || role === Role.Encargado;
  });
  readonly isAdmin = computed(() => this.user()?.role === Role.Administrador);

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

  constructor() {
    this.auth.restoreSession().subscribe();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.url.set(event.urlAfterRedirects);
        this.userMenuOpen.set(false);
        if (event.urlAfterRedirects.startsWith('/cart')) {
          this.refreshCart();
        }
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
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  search(term: string): void {
    const query = term.trim();
    this.router.navigate(['/catalog'], query ? { queryParams: { q: query } } : {});
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/catalog']);
  }

  private refreshCart(): void {
    this.commerce.getCart().subscribe({
      next: (cart) => this.cartCount.set(cart.items.reduce((total, item) => total + item.quantity, 0)),
      error: () => this.cartCount.set(0)
    });
  }
}

