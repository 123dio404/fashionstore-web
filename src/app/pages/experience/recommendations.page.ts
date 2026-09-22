import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BRANDS_LIST, CATEGORIES, FigmaProduct } from '../../core/figma-data';
import { CatalogStore } from '../../core/services/catalog-store.service';

interface StyleProfile {
  brand: string;
  category: string;
  sizes: string[];
  minPrice: number | null;
  maxPrice: number | null;
}

interface ScoredProduct {
  product: FigmaProduct;
  score: number;
  reasons: string[];
  barColor: string;
}

const AI_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/**
 * CU18 — Recomendaciones de IA (vista del cliente, web).
 * Reproduce `design/figma-make/src/web/screens/AIRecsPage.tsx`.
 */
@Component({
  selector: 'app-recommendations-page',
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './recommendations.page.html',
  styleUrl: './recommendations.page.scss',
})
export class RecommendationsPage {
  readonly store = inject(CatalogStore);

  readonly categories = CATEGORIES.filter((c) => c !== 'Ofertas');
  readonly brands = ['Todas las marcas', ...BRANDS_LIST];
  readonly sizes = AI_SIZES;

  readonly results = signal<ScoredProduct[] | null>(null);
  readonly loading = signal(false);
  readonly addedId = signal<number | null>(null);
  readonly budgetError = signal('');

  readonly heartPath =
    'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';

  profile: StyleProfile = {
    brand: 'Todas las marcas',
    category: 'Todas',
    sizes: [],
    minPrice: null,
    maxPrice: null,
  };
  minInput = '';
  maxInput = '';

  get hasProfile(): boolean {
    return (
      this.profile.brand !== 'Todas las marcas' ||
      this.profile.category !== 'Todas' ||
      this.profile.sizes.length > 0 ||
      Boolean(this.minInput) ||
      Boolean(this.maxInput)
    );
  }

  toggleSize(size: string): void {
    const sizes = this.profile.sizes.includes(size)
      ? this.profile.sizes.filter((s) => s !== size)
      : [...this.profile.sizes, size];
    this.profile = { ...this.profile, sizes };
  }

  isSize(size: string): boolean {
    return this.profile.sizes.includes(size);
  }

  setCategory(category: string): void {
    this.profile = { ...this.profile, category };
  }

  setBrand(brand: string): void {
    this.profile = { ...this.profile, brand };
  }

  generate(): void {
    const min = this.minInput ? Number(this.minInput) : null;
    const max = this.maxInput ? Number(this.maxInput) : null;

    if (min !== null && max !== null && min > max) {
      this.budgetError.set('El precio mínimo no puede ser mayor al máximo');
      return;
    }
    this.budgetError.set('');

    const profile: StyleProfile = { ...this.profile, minPrice: min, maxPrice: max };
    this.loading.set(true);

    setTimeout(() => {
      const scored = this.store
        .products()
        .map((product) => this.evaluate(product, profile))
        .filter((item) => item.score >= 0)
        .sort((a, b) => b.score - a.score);
      this.results.set(scored);
      this.loading.set(false);
    }, 1200);
  }

  adjust(): void {
    this.results.set(null);
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

  /** Coincidencia 0-100; `-1` la descarta por presupuesto. */
  private evaluate(product: FigmaProduct, profile: StyleProfile): ScoredProduct {
    let score = 10;
    const reasons: string[] = [];

    if (profile.category !== 'Todas' && product.category === profile.category) {
      score += 40;
      reasons.push(`Categoría ${product.category}`);
    }
    if (profile.brand !== 'Todas las marcas' && product.brand === profile.brand) {
      score += 25;
      reasons.push(`Marca ${product.brand}`);
    }
    if (profile.sizes.some((size) => product.sizes.includes(size))) {
      score += 25;
      reasons.push('Tu talla disponible');
    }
    if (product.discount >= 25) reasons.push(`${product.discount}% descuento`);
    if (product.isFeatured) reasons.push('Destacado');

    if (profile.minPrice !== null && product.price < profile.minPrice) {
      return { product, score: -1, reasons, barColor: '' };
    }
    if (profile.maxPrice !== null && product.price > profile.maxPrice) {
      return { product, score: -1, reasons, barColor: '' };
    }

    const capped = Math.min(score, 100);
    const barColor =
      capped >= 70 ? 'var(--success)' : capped >= 40 ? 'var(--brand)' : 'var(--muted)';
    return { product, score: capped, reasons, barColor };
  }
}
