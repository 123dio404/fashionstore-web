import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BranchesService } from '../../core/services/branches.service';
import { CommerceService } from '../../core/services/commerce.service';
import { BranchResponse, CartItemResponse, CartResponse, SaleResponse } from '../../models';
import { UiEmptyComponent } from '../../shared/ui/empty-state.component';
import { UiErrorComponent } from '../../shared/ui/error-state.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';

/** CU10 carrito + CU11 compra digital (web): prendas a la izquierda, resumen y pago a la derecha. */
@Component({
  selector: 'app-cart-page',
  imports: [CommonModule, FormsModule, RouterLink, UiEmptyComponent, UiErrorComponent, UiSkeletonComponent],
  templateUrl: './cart.page.html',
  styleUrl: './cart.page.scss'
})
export class CartPage {
  private readonly commerce = inject(CommerceService);
  private readonly branchesService = inject(BranchesService);

  readonly cart = signal<CartResponse | null>(null);
  readonly branches = signal<BranchResponse[]>([]);
  readonly sale = signal<SaleResponse | null>(null);
  readonly loading = signal(true);
  readonly checkingOut = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly checkoutError = signal<string | null>(null);

  branchId: number | null = null;

  constructor() {
    this.reload();
    this.branchesService.list().subscribe((items) => this.branches.set(items));
  }

  itemCount(): number {
    return (this.cart()?.items ?? []).reduce((total, item) => total + item.quantity, 0);
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.commerce.getCart().subscribe({
      next: (data) => {
        this.cart.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  setQuantity(item: CartItemResponse, quantity: number): void {
    const value = Math.max(1, Number(quantity) || 1);
    this.commerce.updateItem(item.id, value).subscribe({
      next: (data) => this.cart.set(data),
      error: (err: Error) => this.error.set(err.message)
    });
  }

  remove(item: CartItemResponse): void {
    this.commerce.removeItem(item.id).subscribe({
      next: (data) => this.cart.set(data),
      error: (err: Error) => this.error.set(err.message)
    });
  }

  checkout(): void {
    if (!this.branchId) return;
    this.checkingOut.set(true);
    this.message.set(null);
    this.checkoutError.set(null);
    this.commerce
      .checkout({
        branch_id: this.branchId,
        payment_provider: 'stripe',
        idempotency_key: `web-${Date.now()}`
      })
      .subscribe({
        next: (sale) => {
          this.checkingOut.set(false);
          this.sale.set(sale);
          this.message.set('Compra registrada. El estado del pago lo confirma el backend.');
          this.reload();
        },
        error: (err: Error) => {
          this.checkingOut.set(false);
          this.checkoutError.set(err.message);
        }
      });
  }
}
