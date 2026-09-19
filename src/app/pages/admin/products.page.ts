import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ProductsService } from '../../core/services/products.service';
import {
  CategoryResponse,
  ColorResponse,
  ProductCreate,
  ProductResponse,
  SeasonResponse,
  SizeResponse
} from '../../models';

@Component({
  selector: 'app-products-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Catálogo de prendas</h2>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (message()) {
      <p class="success">{{ message() }}</p>
    }

    <div class="card">
      <h3>Nueva prenda</h3>
      <div class="grid-2">
        <div>
          <label for="name">Nombre</label>
          <input id="name" [(ngModel)]="form.name" />
        </div>
        <div>
          <label for="brand">Marca</label>
          <input id="brand" [(ngModel)]="form.brand" />
        </div>
        <div>
          <label for="category">Categoría</label>
          <select id="category" [(ngModel)]="form.category_id">
            <option [ngValue]="0">Selecciona</option>
            @for (category of categories(); track category.id) {
              <option [ngValue]="category.id">{{ category.name }}</option>
            }
          </select>
        </div>
        <div>
          <label for="season">Temporada</label>
          <select id="season" [(ngModel)]="form.season_id">
            <option [ngValue]="null">Sin temporada</option>
            @for (season of seasons(); track season.id) {
              <option [ngValue]="season.id">{{ season.name }}</option>
            }
          </select>
        </div>
        <div>
          <label for="price">Precio</label>
          <input id="price" type="number" min="0" [(ngModel)]="form.price" />
        </div>
        <div>
          <label for="model">Modelo 3D (URL .glb/.gltf)</label>
          <input id="model" [(ngModel)]="form.model_3d_url" />
        </div>
      </div>
      <br />
      <button class="btn-primary" (click)="create()">Crear prenda</button>
    </div>

    @if (variantProduct(); as product) {
      <div class="card">
        <h3>Agregar variante a "{{ product.name }}"</h3>
        <div class="grid-2">
          <div>
            <label for="size">Talla</label>
            <select id="size" [(ngModel)]="variant.size_id">
              <option [ngValue]="0">Selecciona</option>
              @for (size of sizes(); track size.id) {
                <option [ngValue]="size.id">{{ size.name }}</option>
              }
            </select>
          </div>
          <div>
            <label for="color">Color</label>
            <select id="color" [(ngModel)]="variant.color_id">
              <option [ngValue]="0">Selecciona</option>
              @for (color of colors(); track color.id) {
                <option [ngValue]="color.id">{{ color.name }}</option>
              }
            </select>
          </div>
          <div>
            <label for="codigo">Código</label>
            <input id="codigo" [(ngModel)]="variant.codigo" />
          </div>
          <div>
            <label for="vprice">Precio variante</label>
            <input id="vprice" type="number" min="0" [(ngModel)]="variant.price" />
          </div>
        </div>
        <br />
        <button class="btn-primary" (click)="addVariant(product)">Agregar variante</button>
        <button class="btn" (click)="variantProduct.set(null)">Cancelar</button>
      </div>
    }

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Precio</th>
            <th>Variantes</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (product of products(); track product.id) {
            <tr>
              <td>{{ product.id }}</td>
              <td>{{ product.name }}</td>
              <td>{{ product.brand || '-' }}</td>
              <td>{{ product.price | currency: 'USD' }}</td>
              <td>{{ product.variants.length }}</td>
              <td>
                <span class="badge" [class.ok]="product.is_active">
                  {{ product.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <button class="btn" (click)="variantProduct.set(product)">+ Variante</button>
                <button class="btn-danger" (click)="remove(product)">Eliminar</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class ProductsPage {
  private readonly service = inject(ProductsService);

  readonly products = signal<ProductResponse[]>([]);
  readonly categories = signal<CategoryResponse[]>([]);
  readonly seasons = signal<SeasonResponse[]>([]);
  readonly sizes = signal<SizeResponse[]>([]);
  readonly colors = signal<ColorResponse[]>([]);
  readonly variantProduct = signal<ProductResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  form: ProductCreate = {
    name: '',
    brand: '',
    category_id: 0,
    season_id: null,
    price: 0,
    model_3d_url: null,
    model_3d_format: null,
    is_active: true
  };

  variant = { size_id: 0, color_id: 0, codigo: '', price: null as number | null };

  constructor() {
    this.load();
    this.service.listCategories().subscribe((d) => this.categories.set(d));
    this.service.listSeasons().subscribe((d) => this.seasons.set(d));
    this.service.listSizes().subscribe((d) => this.sizes.set(d));
    this.service.listColors().subscribe((d) => this.colors.set(d));
  }

  private fail(err: Error): void {
    this.error.set(err.message);
    this.message.set(null);
  }

  load(): void {
    this.service.list().subscribe({
      next: (data) => this.products.set(data),
      error: (err: Error) => this.fail(err)
    });
  }

  create(): void {
    if (!this.form.category_id || !this.form.name.trim()) {
      this.fail(new Error('Nombre y categoría son obligatorios.'));
      return;
    }
    this.service.create(this.form).subscribe({
      next: () => {
        this.message.set('Prenda creada.');
        this.error.set(null);
        this.form = {
          name: '',
          brand: '',
          category_id: 0,
          season_id: null,
          price: 0,
          model_3d_url: null,
          model_3d_format: null,
          is_active: true
        };
        this.load();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  addVariant(product: ProductResponse): void {
    if (!this.variant.size_id || !this.variant.color_id || !this.variant.codigo.trim()) {
      this.fail(new Error('Talla, color y código son obligatorios.'));
      return;
    }
    this.service
      .addVariant(product.id, {
        size_id: this.variant.size_id,
        color_id: this.variant.color_id,
        codigo: this.variant.codigo.trim(),
        price: this.variant.price
      })
      .subscribe({
        next: () => {
          this.message.set('Variante agregada.');
          this.error.set(null);
          this.variant = { size_id: 0, color_id: 0, codigo: '', price: null };
          this.variantProduct.set(null);
          this.load();
        },
        error: (err: Error) => this.fail(err)
      });
  }

  remove(product: ProductResponse): void {
    this.service.remove(product.id).subscribe({
      next: () => this.load(),
      error: (err: Error) => this.fail(err)
    });
  }
}
