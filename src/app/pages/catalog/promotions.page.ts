import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ICONS } from '../../core/navigation';
import { MarketingService } from '../../core/services/marketing.service';
import { ProductsService } from '../../core/services/products.service';
import { CollectionResponse, ProductResponse, PromotionResponse } from '../../models';
import { UiEmptyComponent } from '../../shared/ui/empty-state.component';
import { UiErrorComponent } from '../../shared/ui/error-state.component';
import { UiIconComponent } from '../../shared/ui/icon.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';

/** Fila de promoción usada en los banners superiores. */
interface PromotionCard {
  id: number;
  name: string;
  description: string | null;
  badge: string;
  meta: string;
}

/** Producto alcanzado por una promoción activa. */
interface DiscountedProduct {
  product: ProductResponse;
  promotion: PromotionResponse;
  label: string;
  finalPrice: number;
}

/**
 * CU20 — Gestionar colecciones y promociones (vista del cliente, web).
 * Consume `GET /collections` y `GET /promotions` (endpoints públicos).
 */
@Component({
  selector: 'app-promotions-page',
  imports: [
    CommonModule,
    RouterLink,
    UiEmptyComponent,
    UiErrorComponent,
    UiIconComponent,
    UiSkeletonComponent
  ],
  template: `
    <div class="row promo-head">
      <div>
        <h2 style="margin: 0">Colecciones y promociones</h2>
        <p class="muted" style="margin: 0.25rem 0 0">
          Descuentos vigentes publicados por la tienda.
        </p>
      </div>
      <span class="spacer"></span>
      <a class="btn" routerLink="/catalog">
        <app-ui-icon [d]="icons.catalog" [size]="16" /> Ver catálogo completo
      </a>
    </div>

    @if (loading()) {
      <app-ui-skeleton [rows]="3" [height]="112" />
    } @else if (error()) {
      <app-ui-error [message]="error() ?? ''" (retry)="load()" />
    } @else {
      <section class="promo-heroes">
        @for (card of promoHeroes(); track card.id) {
          <article class="promo-hero">
            <span class="promo-off">{{ card.badge }}</span>
            <h3 class="promo-name">{{ card.name }}</h3>
            @if (card.description) {
              <p class="promo-desc">{{ card.description }}</p>
            }
            <span class="promo-meta">
              <app-ui-icon [d]="icons.calendar" [size]="13" color="rgba(255,255,255,.7)" />
              {{ card.meta }}
            </span>
          </article>
        } @empty {
          <app-ui-empty
            icon="🏷️"
            title="Sin promociones activas"
            message="Cuando la tienda publique una promoción aparecerá aquí."
          />
        }
      </section>

      @if (collections().length > 0) {
        <section class="card">
          <h3 style="margin-top: 0">Colecciones</h3>
          <div class="collections">
            @for (collection of collections(); track collection.id) {
              <span class="collection-chip">
                {{ collection.name }}
                <span class="muted">{{ collection.product_ids.length }} prendas</span>
              </span>
            }
          </div>
        </section>
      }

      <section>
        <div class="row" style="margin-bottom: 1rem">
          <h3 style="margin: 0">Productos en oferta</h3>
          <span class="spacer"></span>
          <span class="muted">{{ discounted().length }} productos con descuento vigente</span>
        </div>

        @if (discounted().length === 0) {
          <app-ui-empty
            icon="🔎"
            title="Sin productos en promoción"
            message="Las promociones activas todavía no tienen prendas asociadas."
          />
        } @else {
          <div class="promo-products">
            @for (item of discounted(); track item.product.id) {
              <a class="promo-card" [routerLink]="['/catalog', item.product.id]">
                <div class="promo-thumb">
                  <span class="promo-thumb-off">{{ item.label }}</span>
                  <span class="promo-thumb-initial">{{ initial(item.product) }}</span>
                </div>
                <div class="promo-card-body">
                  <p class="promo-brand">{{ item.product.brand || 'Sin marca' }}</p>
                  <p class="promo-title">{{ item.product.name }}</p>
                  <p class="promo-price">
                    <strong>{{ item.finalPrice | currency: 'USD' }}</strong>
                    <s>{{ item.product.price | currency: 'USD' }}</s>
                  </p>
                  <p class="muted promo-promo">{{ item.promotion.name }}</p>
                </div>
              </a>
            }
          </div>
        }
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .promo-head {
        margin-bottom: 1.5rem;
      }
      .promo-heroes {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        margin-bottom: 1.5rem;
      }
      .promo-hero {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        gap: 0.35rem;
        min-height: 8.5rem;
        padding: 1.25rem;
        border-radius: 16px;
        background: linear-gradient(135deg, var(--sidebar-bg), #374151);
        color: #fff;
        overflow: hidden;
      }
      .promo-off {
        position: absolute;
        top: 1rem;
        right: 1rem;
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
        background: var(--brand);
        color: #fff;
        font-size: 0.72rem;
        font-weight: 700;
      }
      .promo-name {
        margin: 0;
        font-size: 1.25rem;
      }
      .promo-desc {
        margin: 0;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.75);
      }
      .promo-meta {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.72rem;
        color: rgba(255, 255, 255, 0.7);
      }
      .collections {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .collection-chip {
        display: inline-flex;
        align-items: baseline;
        gap: 0.5rem;
        padding: 0.35rem 0.8rem;
        border-radius: 999px;
        background: var(--brand-soft);
        color: var(--brand-dark);
        font-size: 0.82rem;
        font-weight: 600;
      }
      .collection-chip .muted {
        font-size: 0.72rem;
        font-weight: 400;
      }
      .promo-products {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
      }
      .promo-card {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 16px;
        color: var(--text);
      }
      .promo-card:hover {
        box-shadow: var(--shadow-2);
      }
      .promo-thumb {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 9rem;
        background: var(--surface-2);
      }
      .promo-thumb-off {
        position: absolute;
        top: 0.6rem;
        left: 0.6rem;
        padding: 0.2rem 0.55rem;
        border-radius: 6px;
        background: var(--brand);
        color: #fff;
        font-size: 0.72rem;
        font-weight: 700;
      }
      .promo-thumb-initial {
        font-family: var(--font-display);
        font-size: 2.5rem;
        color: var(--muted-2);
      }
      .promo-card-body {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        padding: 0.9rem 1rem 1.1rem;
      }
      .promo-brand {
        margin: 0;
        font-size: 0.68rem;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .promo-title {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 600;
      }
      .promo-price {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        margin: 0.25rem 0 0;
      }
      .promo-price strong {
        font-size: 1.05rem;
      }
      .promo-price s {
        font-size: 0.8rem;
        color: var(--muted-2);
      }
      .promo-promo {
        margin: 0;
        font-size: 0.72rem;
      }
    `
  ]
})
export class PromotionsPage {
  private readonly marketing = inject(MarketingService);
  private readonly productsService = inject(ProductsService);

  readonly icons = ICONS;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly promotions = signal<PromotionResponse[]>([]);
  readonly collections = signal<CollectionResponse[]>([]);
  private readonly products = signal<ProductResponse[]>([]);

  readonly promoHeroes = computed<PromotionCard[]>(() =>
    this.promotions().map((promotion) => ({
      id: promotion.id,
      name: promotion.name,
      description: promotion.description,
      badge: this.discountLabel(promotion),
      meta: this.rangeLabel(promotion)
    }))
  );

  /** Productos alcanzados por una promoción activa, con el mejor descuento aplicado. */
  readonly discounted = computed<DiscountedProduct[]>(() => {
    const products = new Map(this.products().map((product) => [product.id, product]));
    const best = new Map<number, DiscountedProduct>();

    for (const promotion of this.promotions()) {
      for (const productId of promotion.product_ids) {
        const product = products.get(productId);
        if (!product) continue;
        const finalPrice = this.applyDiscount(Number(product.price), promotion);
        const current = best.get(productId);
        if (!current || finalPrice < current.finalPrice) {
          best.set(productId, {
            product,
            promotion,
            label: this.discountLabel(promotion),
            finalPrice
          });
        }
      }
    }

    return [...best.values()].sort((a, b) => a.finalPrice - b.finalPrice);
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      promotions: this.marketing.listPromotions(true),
      collections: this.marketing.listCollections(true),
      products: this.productsService.list()
    }).subscribe({
      next: ({ promotions, collections, products }) => {
        this.promotions.set(promotions);
        this.collections.set(collections);
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  initial(product: ProductResponse): string {
    return (product.brand || product.name).charAt(0).toUpperCase();
  }

  private applyDiscount(price: number, promotion: PromotionResponse): number {
    const value = Number(promotion.discount_value) || 0;
    const result = promotion.discount_type === 'fixed' ? price - value : price * (1 - value / 100);
    return Math.max(0, Math.round(result * 100) / 100);
  }

  private discountLabel(promotion: PromotionResponse): string {
    const value = Number(promotion.discount_value) || 0;
    return promotion.discount_type === 'fixed' ? `- $ ${value.toFixed(2)}` : `-${value}%`;
  }

  private rangeLabel(promotion: PromotionResponse): string {
    const from = promotion.start_date ? new Date(promotion.start_date) : null;
    const to = promotion.end_date ? new Date(promotion.end_date) : null;
    if (!from && !to) return 'Sin fecha límite';
    if (from && to) return `Del ${this.date(from)} al ${this.date(to)}`;
    return to ? `Vence el ${this.date(to)}` : `Desde el ${this.date(from as Date)}`;
  }

  private date(value: Date): string {
    return value.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
