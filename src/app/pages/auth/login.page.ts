import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { BranchesService } from '../../core/services/branches.service';
import { ProductsService } from '../../core/services/products.service';

/** CU02 — Iniciar sesión (web): panel de marca + formulario, según el prototipo de Figma. */
@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.page.html'
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly products = inject(ProductsService);
  private readonly branches = inject(BranchesService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
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
        this.brandCount.set(new Set(active.map((item) => item.brand).filter((brand): brand is string => !!brand)).size);
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
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/catalog']);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message);
      }
    });
  }
}
