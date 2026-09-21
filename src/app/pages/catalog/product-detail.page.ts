import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { FigmaProduct, STORES } from '../../core/figma-data';
import { CatalogStore } from '../../core/services/catalog-store.service';

/**
 * CU08 / CU10 — Detalle de prenda: galería, color, talla, stock por sucursal y carrito.
 * Reproduce `design/figma-make/src/web/screens/ProductDetailPage.tsx`.
 */
@Component({
  selector: 'app-product-detail-page',
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './product-detail.page.html',
  styleUrl: './product-detail.page.scss',
})
export class ProductDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(CatalogStore);

  readonly stores = STORES;

  /** Paths de los iconos del diseño (corazón y estrella). */
  readonly heartPath =
    'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';
  readonly starPath =
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z';

  readonly product = signal<FigmaProduct | undefined>(undefined);
  readonly imgIdx = signal(0);
  readonly colorIdx = signal(0);
  readonly qty = signal(1);
  readonly size = signal('');
  readonly added = signal(false);
  readonly openAcc = signal<string | null>('desc');

  readonly isFav = computed(() => {
    const p = this.product();
    return p ? this.store.isFav(p.id) : false;
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      this.product.set(this.store.byId(id));
      this.imgIdx.set(0);
      this.colorIdx.set(0);
      this.size.set('');
      this.qty.set(1);
    });
  }

  get accordions(): { id: string; label: string; content: string }[] {
    const p = this.product();
    if (!p) return [];
    return [
      { id: 'desc', label: 'Descripción', content: p.description },
      {
        id: 'care',
        label: 'Cuidado',
        content:
          '60% Lana · 40% Poliéster\nLavar en seco. No usar secadora.\nPlanchar a temperatura baja.',
      },
    ];
  }

  toggleFav(): void {
    const p = this.product();
    if (p) this.store.toggleFav(p.id);
  }

  toggleAcc(id: string): void {
    this.openAcc.update((current) => (current === id ? null : id));
  }

  inc(): void {
    this.qty.update((value) => Math.min(9, value + 1));
  }

  dec(): void {
    this.qty.update((value) => Math.max(1, value - 1));
  }

  colorName(): string {
    const p = this.product();
    return p?.colors[this.colorIdx()]?.name ?? '';
  }

  add(): void {
    const p = this.product();
    const pickedSize = this.size();
    if (!p || !pickedSize) return;

    const color = this.colorName();
    for (let i = 0; i < this.qty(); i += 1) {
      this.store.add(p, pickedSize, color);
    }
    this.added.set(true);
    this.qty.set(1);
    setTimeout(() => this.added.set(false), 1800);
  }

  /** Stock de una sucursal (`centro` → clave `Centro`). */
  stockOf(storeId: string): number {
    const p = this.product();
    if (!p) return 0;
    const key = storeId.charAt(0).toUpperCase() + storeId.slice(1);
    return p.stock[key] ?? 0;
  }

  stockLabel(storeId: string): string {
    const qty = this.stockOf(storeId);
    if (qty === 0) return 'Sin stock';
    if (qty <= 2) return `Últimas ${qty} unid.`;
    return `${qty} disponibles`;
  }

  stockTone(storeId: string): string {
    const qty = this.stockOf(storeId);
    if (qty === 0) return 'out';
    if (qty <= 2) return 'low';
    return 'ok';
  }
}
