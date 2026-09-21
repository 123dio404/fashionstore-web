import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ICONS } from '../../core/navigation';
import { ProductsService } from '../../core/services/products.service';
import { CategoryResponse, ColorResponse, ProductResponse, SizeResponse } from '../../models';
import { UiErrorComponent } from '../../shared/ui/error-state.component';
import { UiIconComponent } from '../../shared/ui/icon.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'name';

/** Iconos de línea del card de producto (mismos paths que el prototipo web de Figma). */
const ICON_GRID = ICONS.grid;
const ICON_LIST = [
  'M8 6h13M8 12h13M8 18h13',
  'M3 6h.01M3 12h.01M3 18h.01'
];
const ICON_HEART =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';
const ICON_PLUS = ['M12 5v14', 'M5 12h14'];

/** CU08 — Consultar catálogo y disponibilidad (web): filtros laterales + grid 4 columnas. */
@Component({
  selector: 'app-catalog-page',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UiErrorComponent,
    UiIconComponent,
    UiSkeletonComponent
  ],
  templateUrl: './catalog.page.html',
  styleUrl: './catalog.page.scss'
})
export class CatalogPage {
  private readonly products = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly icons = ICONS;
  readonly list = signal<ProductResponse[]>([]);
  readonly categories = signal<CategoryResponse[]>([]);
  readonly sizes = signal<SizeResponse[]>([]);
  readonly colors = signal<ColorResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly view = signal<'grid' | 'list'>('grid');
  readonly favs = signal<Set<number>>(new Set());

  query = '';
  brand = '';
  categoryId: number | null = null;
  sizeId: number | null = null;
  colorId: number | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  onlyActive = true;
  sort: SortOption = 'relevance';

  /** Marcas presentes en el catálogo cargado. */
  get brands(): string[] {
    const values = this.list()
      .map((product) => product.brand)
      .filter((value): value is string => Boolean(value));
    return [...new Set(values)].sort();
  }

  get hasFilters(): boolean {
    return Boolean(
      this.brand || this.categoryId || this.sizeId || this.colorId || this.minPrice || this.maxPrice
    );
  }

  /** Filtros + orden aplicados sobre el catálogo (también responde al buscador global `?q=`). */
  get filtered(): ProductResponse[] {
    const term = this.query.trim().toLowerCase();
    const min = this.minPrice === null ? null : Number(this.minPrice);
    const max = this.maxPrice === null ? null : Number(this.maxPrice);

    const items = this.list().filter((product) => {
      if (term && !`${product.name} ${product.brand ?? ''}`.toLowerCase().includes(term)) {
        return false;
      }
      if (this.categoryId !== null && product.category_id !== this.categoryId) return false;
      if (this.brand && (product.brand ?? '') !== this.brand) return false;
      if (min !== null && Number(product.price) < min) return false;
      if (max !== null && Number(product.price) > max) return false;
      if (this.onlyActive && !product.is_active) return false;
      if (this.sizeId !== null && !product.variants.some((v) => v.size_id === this.sizeId)) {
        return false;
      }
      if (this.colorId !== null && !product.variants.some((v) => v.color_id === this.colorId)) {
        return false;
      }
      return true;
    });

    switch (this.sort) {
      case 'price-asc':
        return items.sort((a, b) => Number(a.price) - Number(b.price));
      case 'price-desc':
        return items.sort((a, b) => Number(b.price) - Number(a.price));
      case 'name':
        return items.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return items;
    }
  }

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const term = params.get('q');
      if (term !== null) {
        this.query = term;
      }
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      products: this.products.list(),
      categories: this.products.listCategories(),
      sizes: this.products.listSizes(),
      colors: this.products.listColors()
    }).subscribe({
      next: ({ products, categories, sizes, colors }) => {
        this.list.set(products);
        this.categories.set(categories);
        this.sizes.set(sizes);
        this.colors.set(colors);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.query = '';
    this.brand = '';
    this.categoryId = null;
    this.sizeId = null;
    this.colorId = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.onlyActive = true;
    this.sort = 'relevance';
  }

  categoryName(product: ProductResponse): string {
    return this.categories().find((category) => category.id === product.category_id)?.name ?? 'Sin categoría';
  }

  initial(product: ProductResponse): string {
    return (product.brand || product.name).charAt(0).toUpperCase();
  }

  /** Moneda según las reglas del prototipo: `$ 0.00`. */
  priceText(price: number): string {
    return `$ ${Number(price).toFixed(2)}`;
  }

  setView(view: 'grid' | 'list'): void {
    this.view.set(view);
  }

  toggleFav(id: number): void {
    this.favs.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isFav(id: number): boolean {
    return this.favs().has(id);
  }

  open(id: number): void {
    this.router.navigate(['/catalog', id]);
  }

  readonly viewGrid = ICON_GRID;
  readonly viewList = ICON_LIST;
  readonly heart = ICON_HEART;
  readonly plus = ICON_PLUS;
}
