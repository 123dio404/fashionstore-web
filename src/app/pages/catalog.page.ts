import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { ProductResponse } from '../models';

@Component({
  standalone: true, imports: [CommonModule],
  template: `<main class="catalog"><header><a href="/" class="brand">FashionStore</a><a href="/auth/login">Mi cuenta</a></header>
    <p class="eyebrow">Colección</p><h1>Catálogo</h1><p class="error" *ngIf="error()">{{ error() }}</p>
    <p *ngIf="loading()">Cargando productos…</p><div class="grid"><article class="product" *ngFor="let p of products()">
      <div class="product-art">{{ p.name.slice(0,1) }}</div><h2>{{ p.name }}</h2><p class="sku">{{ p.sku }}</p><strong>{{ p.price | currency }}</strong>
      <p>{{ p.description || 'Prenda seleccionada FashionStore.' }}</p></article></div>
    <p *ngIf="!loading() && !products().length">No hay productos disponibles.</p></main>`,
  styles: [`.catalog{max-width:1100px;margin:auto;padding:28px 24px 60px;color:#1d2925}.catalog header{display:flex;justify-content:space-between;border-bottom:1px solid #d8ded8;padding-bottom:20px}.brand{font:700 1.4rem Georgia,serif;color:inherit;text-decoration:none}.catalog header a:last-child{color:inherit}.eyebrow{color:#bb5a3c;text-transform:uppercase;letter-spacing:.16em;font-size:.72rem;font-weight:700;margin-top:60px}.catalog h1{font:400 3.3rem Georgia,serif;margin:8px 0 30px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px}.product{padding:14px;background:#fff;box-shadow:0 8px 28px #1d292510}.product-art{height:180px;background:#c9d3c8;display:grid;place-items:center;font:4rem Georgia,serif;color:#bb5a3c}.product h2{font:600 1.1rem Georgia,serif;margin:16px 0 5px}.product p{color:#66736b;line-height:1.5}.sku{font-size:.75rem;text-transform:uppercase;letter-spacing:.1em}.error{color:#9b3e29}`]
})
export class CatalogPage {
  private readonly api = inject(ApiService); readonly products = signal<ProductResponse[]>([]); readonly loading = signal(true); readonly error = signal('');
  constructor() { this.api.list<ProductResponse>('products').subscribe({ next: v => { this.products.set(v); this.loading.set(false); }, error: () => { this.error.set('No se pudo cargar el catálogo.'); this.loading.set(false); } }); }
}
