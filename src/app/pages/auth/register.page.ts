import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { BranchesService } from '../../core/services/branches.service';
import { MarketingService } from '../../core/services/marketing.service';
import { ProductsService } from '../../core/services/products.service';

/** CU01 — Registro de cliente (web): misma composición de dos paneles que el login. */
@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.page.html'
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly products = inject(ProductsService);
  private readonly branches = inject(BranchesService);
  private readonly marketing = inject(MarketingService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly done = signal(false);
  /** Cifras reales para el panel de marca (sin métricas inventadas). */
  readonly productCount = signal<number | null>(null);
  readonly branchCount = signal<number | null>(null);
  readonly promotionCount = signal<number | null>(null);

  fullName = '';
  email = '';
  password = '';

  constructor() {
    this.products.list().subscribe({
      next: (items) => this.productCount.set(items.filter((item) => item.is_active).length),
      error: () => this.productCount.set(null)
    });
    this.branches.list().subscribe({
      next: (items) => this.branchCount.set(items.length),
      error: () => this.branchCount.set(null)
    });
    this.marketing.listPromotions(true).subscribe({
      next: (items) => this.promotionCount.set(items.length),
      error: () => this.promotionCount.set(null)
    });
  }

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.done.set(false);
    this.auth
      .register({ full_name: this.fullName, email: this.email, password: this.password })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.done.set(true);
          setTimeout(() => this.router.navigate(['/auth/login']), 900);
        },
        error: (err: Error) => {
          this.loading.set(false);
          this.error.set(err.message);
        }
      });
  }
}
