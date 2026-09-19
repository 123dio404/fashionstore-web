import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ProductsService } from '../../core/services/products.service';
import { ProductResponse } from '../../models';

@Component({
  selector: 'app-catalog-page',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="row" style="margin-bottom: 1rem">
      <h2 style="margin: 0">Catálogo</h2>
      <span class="spacer"></span>
      <input
        placeholder="Buscar por nombre o marca"
        [(ngModel)]="query"
        style="max-width: 18rem"
      />
    </div>

    @if (loading()) {
      <p class="muted">Cargando productos...</p>
    }
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (!loading() && filtered().length === 0) {
      <p class="muted">No hay productos disponibles.</p>
    }

    <div class="grid">
      @for (product of filtered(); track product.id) {
        <a class="card" [routerLink]="['/catalog', product.id]">
          <h3 style="margin: 0 0 0.25rem">{{ product.name }}</h3>
          <p class="muted" style="margin: 0">{{ product.brand || 'Sin marca' }}</p>
          <p style="margin: 0.5rem 0">
            <strong>{{ product.price | currency: 'USD' }}</strong>
          </p>
          <span class="badge" [class.warn]="!product.is_active">
            {{ product.is_active ? 'Disponible' : 'Inactivo' }}
          </span>
        </a>
      }
    </div>
  `
})
export class CatalogPage {
  private readonly products = inject(ProductsService);

  query = '';
  readonly list = signal<ProductResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly filtered = computed(() => {
    const term = this.query.trim().toLowerCase();
    if (!term) return this.list();
    return this.list().filter(
      (p) =>
        p.name.toLowerCase().includes(term) || (p.brand ?? '').toLowerCase().includes(term)
    );
  });

  constructor() {
    this.products.list().subscribe({
      next: (items) => {
        this.list.set(items);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}
