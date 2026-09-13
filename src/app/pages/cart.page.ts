import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { CartService } from '../core/services/cart.service';
import { CommerceService } from '../core/services/commerce.service';
import { BranchResponse, CartItemResponse } from '../models';

@Component({
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="container page">
      <div class="page-head">
        <p class="eyebrow">Tu compra</p>
        <h1 class="page-title">Carrito</h1>
      </div>

      @if (loading()) {
        <div class="loading-row"><span class="spinner"></span> Cargando carrito…</div>
      }

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }

      @if (message()) {
        <div class="alert alert-success">{{ message() }}</div>
      }

      @if (!loading() && items().length) {
        <div class="cart-grid">
          <section class="card">
            <div class="card-head">
              <h3>Productos</h3>
              <span class="badge badge-neutral">{{ items().length }} {{ items().length === 1 ? 'artículo' : 'artículos' }}</span>
            </div>

            <div class="cart-items">
              @for (item of items(); track item.id) {
                <div class="cart-row">
                  <div class="cart-art">{{ item.product_name.charAt(0) }}</div>
                  <div class="cart-info">
                    <div class="cart-name">{{ item.product_name }}</div>
                    <div class="small muted-2">{{ item.size || '—' }} · {{ item.color || '—' }}</div>
                    <div class="cart-price">{{ item.price | currency }}</div>
                  </div>
                  <div class="cart-actions">
                    <button class="btn btn-outline btn-sm" (click)="decrement(item)" [disabled]="item.quantity <= 1">−</button>
                    <span class="cart-qty">{{ item.quantity }}</span>
                    <button class="btn btn-outline btn-sm" (click)="increment(item)">+</button>
                    <button class="btn btn-ghost btn-sm" (click)="remove(item)">✕</button>
                  </div>
                  <div class="cart-subtotal">{{ item.price * item.quantity | currency }}</div>
                </div>
              }
            </div>
          </section>

          <aside class="checkout-card card">
            <h3>Resumen</h3>

            <div class="summary-row">
              <span>Total</span>
              <strong>{{ total() | currency }}</strong>
            </div>

            <label class="field-label mt-2" for="checkout-branch">Sucursal de retiro
              <select id="checkout-branch" #branchSelect>
                @for (b of branches(); track b.id) {
                  <option [value]="b.id">{{ b.name }}</option>
                }
              </select>
            </label>

            <button class="btn btn-primary btn-block mt-2" (click)="checkout(branchSelect.value)" [disabled]="checkingOut()">
              {{ checkingOut() ? 'Procesando…' : 'Confirmar compra' }}
            </button>

            <a class="btn btn-outline btn-block mt-1" routerLink="/catalog">Seguir comprando</a>
          </aside>
        </div>
      }

      @if (!loading() && !items().length) {
        <div class="empty">
          <div class="empty-icon">🛒</div>
          <h3>Tu carrito está vacío</h3>
          <p>Explora nuestro catálogo para encontrar prendas que te encanten.</p>
          <a class="btn btn-primary mt-1" routerLink="/catalog">Ir al catálogo</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .cart-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.6fr);
      gap: 22px;
      align-items: start;
    }
    .cart-items { display: grid; gap: 0; }
    .cart-row {
      display: grid;
      grid-template-columns: 56px minmax(0, 1fr) auto auto;
      gap: 14px;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid var(--line);
    }
    .cart-row:last-child { border-bottom: 0; }
    .cart-art {
      width: 56px; height: 56px;
      display: grid; place-items: center;
      border-radius: var(--radius-sm);
      background: var(--sage);
      font-family: var(--font-display);
      font-size: 1.6rem; color: var(--accent);
    }
    .cart-name { font-weight: 700; }
    .cart-price { font-size: 0.88rem; color: var(--muted); margin-top: 2px; }
    .cart-actions { display: flex; align-items: center; gap: 6px; }
    .cart-qty { font-weight: 700; min-width: 28px; text-align: center; }
    .cart-subtotal { font-weight: 700; text-align: right; white-space: nowrap; }
    .checkout-card { position: sticky; top: calc(var(--header-h) + 20px); }
    .checkout-card h3 { margin-bottom: 14px; }
    .summary-row {
      display: flex; justify-content: space-between; gap: 12px;
      font-size: 1.05rem; padding: 12px 0; border-bottom: 1px solid var(--line); margin-bottom: 12px;
    }
    @media (max-width: 720px) {
      .cart-grid { grid-template-columns: 1fr; }
      .cart-row { grid-template-columns: 44px 1fr; }
      .cart-actions { grid-column: 1 / -1; justify-self: end; }
      .cart-subtotal { grid-column: 2; justify-self: end; }
      .checkout-card { position: static; }
    }
  `]
})
export class CartPage {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly commerce = inject(CommerceService);
  private readonly cartSvc = inject(CartService);
  private readonly router = inject(Router);

  readonly items = signal<CartItemResponse[]>([]);
  readonly total = signal(0);
  readonly branches = signal<BranchResponse[]>([]);
  readonly loading = signal(true);
  readonly checkingOut = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    this.commerce.getCart().subscribe({
      next: (cart) => {
        this.items.set(cart.items);
        this.total.set(Number(cart.total));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el carrito.');
        this.loading.set(false);
      }
    });
    this.api.list<BranchResponse>('branches').subscribe({
      next: (v) => this.branches.set(v.filter((b) => b.is_active)),
      error: () => this.branches.set([])
    });
  }

  increment(item: CartItemResponse): void {
    this.commerce.updateItem(item.id, { quantity: item.quantity + 1 }).subscribe({
      next: (cart) => {
        this.items.set(cart.items);
        this.total.set(Number(cart.total));
        this.cartSvc.refresh();
      },
      error: (e: Error) => this.error.set(e.message || 'No se pudo actualizar.')
    });
  }

  decrement(item: CartItemResponse): void {
    if (item.quantity <= 1) { return; }
    this.commerce.updateItem(item.id, { quantity: item.quantity - 1 }).subscribe({
      next: (cart) => {
        this.items.set(cart.items);
        this.total.set(Number(cart.total));
        this.cartSvc.refresh();
      },
      error: (e: Error) => this.error.set(e.message || 'No se pudo actualizar.')
    });
  }

  remove(item: CartItemResponse): void {
    this.commerce.removeItem(item.id).subscribe({
      next: (cart) => {
        this.items.set(cart.items);
        this.total.set(Number(cart.total));
        this.cartSvc.refresh();
        this.message.set('Artículo eliminado.');
      },
      error: (e: Error) => this.error.set(e.message || 'No se pudo eliminar.')
    });
  }

  checkout(branchIdStr: string): void {
    const branchId = Number(branchIdStr);
    if (!branchId) {
      this.error.set('Selecciona una sucursal.');
      return;
    }
    this.checkingOut.set(true);
    this.error.set('');
    this.message.set('');
    this.commerce.checkout({ branch_id: branchId }).subscribe({
      next: (sale) => {
        this.checkingOut.set(false);
        this.message.set(`¡Compra realizada! Tu pedido #${sale.id} fue registrado exitosamente.`);
        this.cartSvc.refresh();
        this.items.set([]);
        this.total.set(0);
      },
      error: (e: Error) => {
        this.checkingOut.set(false);
        this.error.set(e.message || 'No se pudo completar la compra.');
      }
    });
  }
}