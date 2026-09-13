import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiService } from '../core/services/api.service';
import { CategoryResponse, ProductResponse } from '../models';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  template: `
    <div class="container page">
      <div class="page-head">
        <p class="eyebrow">Colección</p>
        <h1 class="page-title">Catálogo</h1>
        <p class="page-lead">
          Prendas seleccionadas con intención. Busca por nombre, navega por categoría y encuentra tu próximo favorito.
        </p>
      </div>

      <div class="filters">
        <label class="search-box">
          <input
            type="search"
            placeholder="Buscar producto o marca…"
            [formControl]="search"
            aria-label="Buscar en el catálogo"
          />
        </label>
        <select class="category-select" [value]="selectedCategory() ?? ''" (change)="onCategory($event)" aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          @for (c of categories(); track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>
      </div>

      @if (loading()) {
        <div class="loading-row"><span class="spinner"></span> Cargando productos…</div>
      }

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }

      @if (!loading() && filtered().length) {
        <div class="product-grid">
          @for (p of filtered(); track p.id) {
            <a class="product-card" routerLink="/catalog/{{ p.id }}">
              <div class="product-art">{{ p.name.charAt(0) }}</div>
              @if (p.variants.length) {
                <span class="variant-count">{{ p.variants.length }} {{ p.variants.length === 1 ? 'variante' : 'variantes' }}</span>
              }
              <div class="product-body">
                <div class="flex-between">
                  <span class="product-brand">{{ p.brand || 'FashionStore' }}</span>
                  <span class="product-price">{{ p.price | currency }}</span>
                </div>
                <h3 class="product-name">{{ p.name }}</h3>
                <span class="btn btn-outline btn-sm btn-block">Ver detalles</span>
              </div>
            </a>
          }
        </div>
      }

      @if (!loading() && !filtered().length) {
        <div class="empty">
          <div class="empty-icon">◌</div>
          <h3>Sin resultados</h3>
          <p>No encontramos productos con esos criterios. Intenta con otro término o categoría.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .filters {
      display: grid;
      grid-template-columns: 1fr minmax(200px, 300px);
      gap: 12px;
      margin: 6px 0 24px;
    }
    .search-box input {
      padding: 13px 14px;
    }
    .category-select {
      padding: 13px 14px;
    }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 20px;
    }
    .product-card {
      position: relative;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--white);
      box-shadow: var(--shadow-1);
      overflow: hidden;
      color: var(--ink);
      text-decoration: none;
      transition: transform 180ms ease, box-shadow 180ms ease;
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-2);
    }
    .product-art {
      display: grid;
      place-items: center;
      aspect-ratio: 4 / 3;
      background: linear-gradient(135deg, var(--sage) 0%, var(--sage-2) 100%);
      font-family: var(--font-display);
      font-size: 3.4rem;
      color: var(--accent);
    }
    .variant-count {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(29, 41, 37, 0.75);
      color: var(--paper);
      font-size: 0.68rem;
      font-weight: 700;
    }
    .product-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 14px 16px 16px;
    }
    .product-brand {
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--muted-2);
    }
    .product-price { font-weight: 700; color: var(--ink); }
    .product-name { margin: 0; font-size: 1.05rem; }
    @media (max-width: 720px) {
      .filters { grid-template-columns: 1fr; }
      .product-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
    }
  `]
})
export class CatalogPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly search = new FormControl('');
  readonly products = signal<ProductResponse[]>([]);
  readonly categories = signal<CategoryResponse[]>([]);
  readonly selectedCategory = signal<number | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const raw = params.get('category');
      this.selectedCategory.set(raw ? Number(raw) : null);
    });

    this.api.list<CategoryResponse>('parameters/categories').subscribe({
      next: (v) => this.categories.set(v),
      error: () => this.categories.set([])
    });

    this.api.list<ProductResponse>('products').subscribe({
      next: (v) => {
        this.products.set(v);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo. Intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onCategory(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCategory.set(value ? Number(value) : null);
  }

  filtered(): ProductResponse[] {
    const term = (this.search.value ?? '').trim().toLowerCase();
    let list = this.products().filter((p) => p.is_active);
    const category = this.selectedCategory();
    if (category !== null) {
      list = list.filter((p) => p.category_id === category);
    }
    if (term) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.brand ?? '').toLowerCase().includes(term)
      );
    }
    return list;
  }
}