import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { Role } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [RouterOutlet, RouterLink, RouterLinkActive]
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly cartSvc = inject(CartService);
  private readonly router = inject(Router);

  menuOpen = false;

  constructor() {
    if (this.auth.hasToken()) {
      this.auth.restoreSession().subscribe(() => this.cartSvc.refresh());
    }
  }

  get user() {
    return this.auth.currentUser();
  }

  get count() {
    return this.cartSvc.count();
  }

  get isStaff(): boolean {
    const role = this.auth.currentUser()?.role;
    return role === Role.Administrador || role === Role.Encargado || role === Role.Cajero;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    this.auth.logout();
    this.cartSvc.reset();
    this.menuOpen = false;
    this.router.navigate(['/']);
  }
}