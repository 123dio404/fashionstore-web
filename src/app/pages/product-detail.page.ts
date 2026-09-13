import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { CartService } from '../core/services/cart.service';
import { CommerceService } from '../core/services/commerce.service';
import {
  BranchResponse,
  CategoryResponse,
  ColorResponse,
  ProductResponse,
  SizeResponse,
  StockResponse,
  VariantResponse
} from '../models';

@Component({
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/catalog">← Volver al catálogo</a>

      @if (loading()) {
        <div class="loading-row"><span class="spinner"></span> Cargando producto…</div>
      }

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }

      @if (product(); as p) {
        <div class="detail-grid">
          <div class="detail-art">{{ p.name.charAt(0) }}</div>

          <div class="detail-info">
            <p class="eyebrow">{{ categoryName(p) }}</p>
            <h1 class="detail-title">{{ p.name }}</h1>
            @if (p.brand) {
              <p class="detail-brand">{{ p.brand }}</p>
            }
            <p class="detail-price">{{ p.price | currency }}</p>

            @if (branches().length) {
              <label class="field-label" for="branch">Sucursal
                <select id="branch" [value]="branchId() ?? ''" (change)="onBranch($event)">
                  @for (b of branches(); track b.id) {
                    <option [value]="b.id">{{ b.name }} — {{ b.address }}</option>
                  }
                </select>
              </label>
            }

            @if (stockRows().length) {
              <p class="field-label">Variante
                <span class="hint">Selecciona talla y color</span>
              </p>
              <div class="variant-list">
                @for (v of p.variants; track v.id) {
                  <button
                    type="button"
                    class="variant-row"
                    [class.selected]="selectedVariantId() === v.id"
                    [class.sold-out]="stockFor(v.id) <= 0"
                    (click)="selectVariant(v.id)"
                  >
                    <span class="variant-name">{{ sizeName(v) }} · {{ colorName(v) }}</span>
                    <span class="variant-code">{{ v.codigo }}</span>
                    <span class="variant-meta">
                      @if (stockFor(v.id) > 0) {
                        <span class="badge badge-success">{{ stockFor(v.id) }} disponibles</span>
                      } @else {
                        <span class="badge badge-danger">Sin stock</span>
                      }
                    </span>
                  </button>
                }
              </div>
            }

            @if (selectedVariantId() && stockRows().length) {
              <div class="buy-box">
                <label class="field-label" for="quantity">Cantidad
                  <input id="quantity" type="number" min="1" [max]="maxQuantity()" [value]="quantity()" (input)="onQuantity($event)" />
                </label>

                @if (user()) {
                  <button class="btn btn-primary buy-btn" [disabled]="saving() || stockFor(selectedVariantId() ?? 0) <= 0" (click)="addToCart()">
                    {{ saving() ? 'Agregando…' : 'Agregar al carrito' }}
                  </button>
                } @else {
                  <a class="btn btn-primary buy-btn" routerLink="/auth/login">Inicia sesión para comprar</a>
                }
              </div>
            }

            @if (message()) {
              <div class="alert alert-success mt-2">{{ message() }}</div>
            }
          </div>
        </div>

        <section class="card mt-3">
          <h3>Información de la prenda</h3>
          <div class="info-grid">
            <div><span class="muted-2 small">Categoría</span><div class="strong">{{ categoryName(p) }}</div></div>
            <div><span class="muted-2 small">Marca</span><div class="strong">{{ p.brand || '—' }}</div></div>
            <div><span class="muted-2 small">Precio base</span><div class="strong">{{ p.price | currency }}</div></div>
            <div><span class="muted-2 small">Variantes</span><div class="strong">{{ p.variants.length }}</div></div>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .back-link { display: inline-block; color: var(--muted); font-weight: 600; margin-bottom: 18px; }
    .back-link:hover { color: var(--accent); }
    .detail-grid {
      display: grid;
      grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.1fr);
      gap: clamp(22px, 4vw, 48px);
      align-items: start;
    }
    .detail-art {
      position: sticky;
      top: calc(var(--header-h) + 20px);
      display: grid;
      place-items: center;
      aspect-ratio: 3 / 4;
      border-radius: var(--radius);
      background: linear-gradient(150deg, var(--sage) 0%, var(--sage-2) 100%);
      font-family: var(--font-display);
      font-size: 6rem;
      color: var(--accent);
    }
    .detail-title {
      margin: 8px 0 0;
      font-size: clamp(1.9rem, 4vw, 2.9rem);
      font-weight: 500;
    }
    .detail-brand { margin: 4px 0 0; color: var(--muted-2); font-weight: 600; }
    .detail-price { margin: 14px 0 0; font-family: var(--font-display); font-size: 1.6rem; font-weight: 700; }
    .field-label { display: grid; gap: 8px; margin-top: 22px; font-size: 0.82rem; font-weight: 700; }
    .hint { color: var(--muted-2); font-weight: 400; font-size: 0.76rem; display: block; }
    .variant-list { display: grid; gap: 8px; margin-top: 8px; }
    .variant-row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 12px;
      align-items: center;
      padding: 12px 14px;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      background: var(--white);
      text-align: left;
      cursor: pointer;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }
    .variant-row:hover { border-color: var(--accent); }
    .variant-row.selected { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(187, 90, 60, 0.14); }
    .variant-row.sold-out { opacity: 0.6; }
    .variant-name { font-weight: 700; }
    .variant-code { font-size: 0.74rem; color: var(--muted-2); text-transform: uppercase; letter-spacing: 0.05em; }
    .buy-box { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; margin-top: 20px; }
    .buy-box .field-label { flex: 0 0 130px; margin-top: 0; }
    .buy-btn { flex: 1; min-width: 200px; }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
    }
    @media (max-width: 860px) {
      .detail-grid { grid-template-columns: 1fr; }
      .detail-art { position: static; aspect-ratio: 1 / 1; }
    }
  `]
})
export class ProductDetailPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly commerce = inject(CommerceService);
  private readonly cartSvc = inject(CartService);

  readonly product = signal<ProductResponse | null>(null);
  readonly branches = signal<BranchResponse[]>([]);
  readonly sizes = signal<SizeResponse[]>([]);
  readonly colors = signal<ColorResponse[]>([]);
  readonly categories = signal<CategoryResponse[]>([]);
    readonly stockRows = signal<StockResponse[]>([]);

  readonly branchId = signal<number | null>(null);
  readonly selectedVariantId = signal<number | null>(null);
  readonly quantity = signal(1);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  constructor() {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (!rawId) {
      this.error.set('Producto no encontrado.');
      this.loading.set(false);
      return;
    }
    const id = Number(rawId);

    this.api.list<BranchResponse>('branches').subscribe({
      next: (v) => {
        this.branches.set(v.filter((b) => b.is_active));
        const first = v.find((b) => b.is_active);
        if (first) {
          this.branchId.set(first.id);
          this.loadAvailability(id);
        }
      },
      error: () => this.branches.set([])
    });
    this.api.list<SizeResponse>('parameters/sizes').subscribe({ next: (v) => this.sizes.set(v), error: () => this.sizes.set([]) });
    this.api.list<ColorResponse>('parameters/colors').subscribe({ next: (v) => this.colors.set(v), error: () => this.colors.set([]) });
    this.api.list<CategoryResponse>('parameters/categories').subscribe({ next: (v) => this.categories.set(v), error: () => this.categories.set([]) });

    this.api.get<ProductResponse>(`products/${id}`).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
        if (p.variants.length === 1) {
          this.selectedVariantId.set(p.variants[0].id);
        }
      },
      error: () => {
        this.error.set('No se pudo cargar el producto.');
        this.loading.set(false);
      }
    });
  }

  onBranch(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.branchId.set(id);
    this.selectedVariantId.set(null);
    const product = this.product();
    if (product) {
      this.loadAvailability(product.id);
    }
  }

  onQuantity(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.quantity.set(value > 0 ? value : 1);
  }

  selectVariant(id: number): void {
    this.selectedVariantId.set(id);
  }

  private loadAvailability(_productId: number): void {
    const branch = this.branchId();
    if (branch === null) {
      this.stockRows.set([]);
      return;
    }
    this.api.list<StockResponse>('inventory/stock', { branch_id: branch }).subscribe({
      next: (rows) => {
        const variantIds = this.product()?.variants.map((v) => v.id) ?? [];
        const filtered = rows.filter((r) => variantIds.includes(r.variant_id));
        this.stockRows.set(filtered);
      },
      error: () => this.stockRows.set([])
    });
  }

  stockFor(variantId: number): number {
    const row = this.stockRows().find((a) => a.variant_id === variantId);
    return row ? row.available_stock : 0;
  }

  maxQuantity(): number {
    const id = this.selectedVariantId();
    return id !== null ? Math.max(this.stockFor(id), 1) : 1;
  }

  sizeName(v: VariantResponse): string {
    return this.sizes().find((s) => s.id === v.size_id)?.name ?? 'Talla —';
  }

  colorName(v: VariantResponse): string {
    return this.colors().find((c) => c.id === v.color_id)?.name ?? 'Color —';
  }

  categoryName(p: ProductResponse): string {
    return this.categories().find((c) => c.id === p.category_id)?.name ?? 'Prendas';
  }

  user() {
    return this.auth.currentUser();
  }

  addToCart(): void {
    const variantId = this.selectedVariantId();
    if (variantId === null) {
      return;
    }
    const row = this.stockRows().find((a) => a.variant_id === variantId);
    if (!row || row.available_stock <= 0) {
      this.message.set('Este producto no tiene stock disponible en la sucursal elegida.');
      return;
    }
    this.saving.set(true);
    this.message.set('');
    this.commerce.addItem({ stock_id: row.id, quantity: this.quantity() }).subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set('Se agregó al carrito.');
        this.cartSvc.refresh();
      },
      error: (error: Error) => {
        this.saving.set(false);
        this.message.set('');
        this.error.set(error.message || 'No se pudo agregar al carrito.');
      }
    });
  }
}