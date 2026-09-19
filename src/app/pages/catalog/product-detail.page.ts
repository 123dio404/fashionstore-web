import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BranchesService } from '../../core/services/branches.service';
import { CommerceService } from '../../core/services/commerce.service';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductsService } from '../../core/services/products.service';
import { AuthService } from '../../core/services/auth.service';
import { BranchResponse, ProductResponse, StockResponse } from '../../models';

@Component({
  selector: 'app-product-detail-page',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <a routerLink="/catalog" class="muted">← Volver al catálogo</a>

    @if (loading()) {
      <p class="muted">Cargando...</p>
    }
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (product(); as p) {
      <div class="card">
        <h2 style="margin: 0">{{ p.name }}</h2>
        <p class="muted">{{ p.brand || 'Sin marca' }}</p>
        <p><strong>{{ p.price | currency: 'USD' }}</strong></p>
        @if (p.model_3d_url) {
          <p class="muted">Modelo 3D: {{ p.model_3d_url }}</p>
        }
        @if (p.technical_metadata) {
          <p class="muted">{{ p.technical_metadata }}</p>
        }
      </div>

      <div class="card">
        <h3>Disponibilidad por sucursal</h3>
        <div class="toolbar">
          <div class="field">
            <label for="branch">Sucursal</label>
            <select id="branch" [(ngModel)]="branchId" (ngModelChange)="loadStock($event)">
              <option [ngValue]="null">Selecciona una sucursal</option>
              @for (branch of branches(); track branch.id) {
                <option [ngValue]="branch.id">{{ branch.name }}</option>
              }
            </select>
          </div>
        </div>

        @if (message()) {
          <p class="success">{{ message() }}</p>
        }
        @if (cartError()) {
          <p class="error">{{ cartError() }}</p>
        }

        @if (stocks().length > 0) {
          <table>
            <thead>
              <tr>
                <th>Variante</th>
                <th>Físico</th>
                <th>Reservado</th>
                <th>Disponible</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (stock of stocks(); track stock.id) {
                <tr>
                  <td>#{{ stock.variant_id }}</td>
                  <td>{{ stock.physical_stock }}</td>
                  <td>{{ stock.reserved_stock }}</td>
                  <td>{{ stock.available_stock }}</td>
                  <td>
                    <button
                      class="btn-primary"
                      [disabled]="stock.available_stock <= 0"
                      (click)="addToCart(stock)"
                    >
                      Agregar
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else if (branchId) {
          <p class="muted">Sin stock registrado en esta sucursal.</p>
        }
      </div>
    }
  `
})
export class ProductDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly products = inject(ProductsService);
  private readonly branchesService = inject(BranchesService);
  private readonly inventory = inject(InventoryService);
  private readonly commerce = inject(CommerceService);
  private readonly auth = inject(AuthService);

  readonly product = signal<ProductResponse | null>(null);
  readonly branches = signal<BranchResponse[]>([]);
  readonly stocks = signal<StockResponse[]>([]);
  branchId: number | null = null;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly cartError = signal<string | null>(null);

  private readonly productId = Number(this.route.snapshot.paramMap.get('id'));

  constructor() {
    this.products.get(this.productId).subscribe({
      next: (items) => {
        this.product.set(items);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
    this.branchesService.list().subscribe((items) => this.branches.set(items));
  }

  loadStock(branchId: number | null): void {
    this.message.set(null);
    this.cartError.set(null);
    if (!branchId) {
      this.stocks.set([]);
      return;
    }
    const variantIds = new Set((this.product()?.variants ?? []).map((v) => v.id));
    this.inventory.listStock(branchId).subscribe({
      next: (items) => this.stocks.set(items.filter((s) => variantIds.has(s.variant_id))),
      error: (err: Error) => this.cartError.set(err.message)
    });
  }

  addToCart(stock: StockResponse): void {
    this.message.set(null);
    this.cartError.set(null);
    if (!this.auth.hasToken()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.commerce.addItem({ stock_id: stock.id, quantity: 1 }).subscribe({
      next: () => this.message.set('Producto agregado al carrito.'),
      error: (err: Error) => this.cartError.set(err.message)
    });
  }
}
