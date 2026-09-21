import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BRANDS_LIST, CATEGORIES, FigmaProduct } from '../../core/figma-data';
import { ICONS } from '../../core/navigation';
import { CatalogStore } from '../../core/services/catalog-store.service';
import { UiIconComponent } from '../../shared/ui/icon.component';

type SortOption = 'relevant' | 'price-asc' | 'price-desc' | 'rating' | 'new';

/**
 * CU08 — Catálogo público con imágenes, filtros, orden y carrito.
 * Reproduce `design/figma-make/src/web/screens/CatalogPage.tsx`.
 */
@Component({
  selector: 'app-catalog-page',
  imports: [CommonModule, FormsModule, RouterLink, UiIconComponent],
  templateUrl: './catalog.page.html',
  styleUrl: './catalog.page.scss',
})
export class CatalogPage {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(CatalogStore);

  readonly icons = ICONS;
  readonly categories = CATEGORIES;
  readonly brands = ['Todas las marcas', ...BRANDS_LIST];
  readonly sorts: { v: SortOption; l: string }[] = [
    { v: 'relevant', l: 'Más relevantes' },
    { v: 'price-asc', l: 'Precio: menor a mayor' },
    { v: 'price-desc', l: 'Precio: mayor a menor' },
    { v: 'rating', l: 'Mejor valorados' },
    { v: 'new', l: 'Más recientes' },
  ];

  /** Paths usados por las tarjetas (estrella de rating y corazón de favoritos). */
  readonly starPath =
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z';
  readonly heartPath =
    'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';

  readonly addedId = signal<number | null>(null);
  readonly view = signal<'grid' | 'list'>('grid');

  query = '';
  category = 'Todas';
  brand = 'Todas las marcas';
  sort: SortOption = 'relevant';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  onSale = false;

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const term = params.get('q');
      if (term !== null) this.query = term;
    });
  }

  /** Filtros + orden sobre el catálogo demo (también responde al buscador global `?q=`). */
  get filtered(): FigmaProduct[] {
    const term = this.query.trim().toLowerCase();
    const min = this.minPrice === null ? null : Number(this.minPrice);
    const max = this.maxPrice === null ? null : Number(this.maxPrice);

    const items = this.store.products().filter((product) => {
      if (this.category !== 'Todas' && product.category !== this.category) return false;
      if (this.brand !== 'Todas las marcas' && product.brand !== this.brand) return false;
      if (term && !`${product.name} ${product.brand}`.toLowerCase().includes(term)) {
        return false;
      }
      if (this.onSale && product.discount < 20) return false;
      if (min !== null && product.price < min) return false;
      if (max !== null && product.price > max) return false;
      return true;
    });

    switch (this.sort) {
      case 'price-asc':
        return [...items].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...items].sort((a, b) => b.price - a.price);
      case 'rating':
        return [...items].sort((a, b) => b.rating - a.rating);
      case 'new':
        return [...items].sort(
          (a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false)
        );
      default:
        return items;
    }
  }

  get hasFilters(): boolean {
    return Boolean(
      this.query ||
        this.category !== 'Todas' ||
        this.brand !== 'Todas las marcas' ||
        this.minPrice ||
        this.maxPrice ||
        this.onSale
    );
  }

  clearFilters(): void {
    this.query = '';
    this.category = 'Todas';
    this.brand = 'Todas las marcas';
    this.minPrice = null;
    this.maxPrice = null;
    this.onSale = false;
    this.sort = 'relevant';
  }

  isFav(id: number): boolean {
    return this.store.isFav(id);
  }

  toggleFav(id: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.store.toggleFav(id);
  }

  add(product: FigmaProduct, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.store.add(product);
    this.addedId.set(product.id);
    setTimeout(() => this.addedId.set(null), 1400);
  }
}
