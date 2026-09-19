import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BranchesService } from '../../core/services/branches.service';
import { CommerceService } from '../../core/services/commerce.service';
import { BranchResponse, CartResponse, CartItemResponse, SaleResponse } from '../../models';

@Component({
  selector: 'app-cart-page',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <h2>Mi carrito</h2>

    @if (loading()) {
      <p class="muted">Cargando...</p>
    }
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (cart(); as current) {
      @if (current.items.length === 0) {
        <div class="card">
          <p class="muted">Tu carrito está vacío.</p>
          <a class="btn" routerLink="/catalog">Ir al catálogo</a>
        </div>
      } @else {
        <div class="card">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Talla</th>
                <th>Color</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of current.items; track item.id) {
                <tr>
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.size || '-' }}</td>
                  <td>{{ item.color || '-' }}</td>
                  <td>{{ item.price | currency: 'USD' }}</td>
                  <td style="max-width: 6rem">
                    <input
                      type="number"
                      min="1"
                      [ngModel]="item.quantity"
                      (ngModelChange)="setQuantity(item, $event)"
                    />
                  </td>
                  <td>
                    <button class="btn-danger" (click)="remove(item)">Quitar</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <p style="text-align: right; margin-top: 1rem">
            <strong>Total: {{ current.total | currency: 'USD' }}</strong>
          </p>
        </div>

        <div class="card">
          <h3>Finalizar compra</h3>
          <div class="toolbar">
            <div class="field">
              <label for="branch">Sucursal de despacho</label>
              <select id="branch" [(ngModel)]="branchId">
                <option [ngValue]="null">Selecciona una sucursal</option>
                @for (branch of branches(); track branch.id) {
                  <option [ngValue]="branch.id">{{ branch.name }}</option>
                }
              </select>
            </div>
            <button class="btn-primary" [disabled]="!branchId || checkingOut()" (click)="checkout()">
              {{ checkingOut() ? 'Procesando...' : 'Pagar con Stripe' }}
            </button>
          </div>
          @if (message()) {
            <p class="success">{{ message() }}</p>
          }
          @if (checkoutError()) {
            <p class="error">{{ checkoutError() }}</p>
          }
          @if (sale(); as completed) {
            <p class="muted">
              Orden #{{ completed.id }} por {{ completed.total | currency: 'USD' }} · Estado:
              {{ completed.payments[0]?.status || 'pendiente' }}
            </p>
            <a class="btn" routerLink="/purchase-history">Ver historial de compras</a>
          }
        </div>
      }
    }
  `
})
export class CartPage {
  private readonly commerce = inject(CommerceService);
  private readonly branchesService = inject(BranchesService);

  readonly cart = signal<CartResponse | null>(null);
  readonly branches = signal<BranchResponse[]>([]);
  readonly sale = signal<SaleResponse | null>(null);
  branchId: number | null = null;
  readonly loading = signal(true);
  readonly checkingOut = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly checkoutError = signal<string | null>(null);

  constructor() {
    this.reload();
    this.branchesService.list().subscribe((items) => this.branches.set(items));
  }

  reload(): void {
    this.loading.set(true);
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
