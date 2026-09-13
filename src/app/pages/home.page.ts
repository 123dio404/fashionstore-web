import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { CategoryResponse, ProductResponse } from '../models';

@Component({
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <section class="hero" aria-labelledby="hero-title">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Nueva colección · {{ year }}</p>
          <h1 id="hero-title">Viste tu historia.</h1>
          <p class="hero-lead">
            Descubre prendas seleccionadas para acompañar tu estilo todos los días.
          </p>
          <div class="hero-actions">
            <a class="btn btn-primary" routerLink="/catalog">Explorar el catálogo <span aria-hidden="true">→</span></a>
            @if (!user()) {
              <a class="btn btn-outline" routerLink="/auth/register">Crear cuenta</a>
            }
          </div>
        </div>
        <div class="hero-art" role="img" aria-label="Selección de moda FashionStore">
          <div class="art art-main"></div>
          <div class="art art-small"></div>
          <span class="art-label">FS<br />STUDIO</span>
        </div>
      </div>
    </section>

    @if (categories().length) {
      <section class="container band" aria-label="Categorías">
        <p class="eyebrow">Navega por categorías</p>
        <div class="chip-row">
          @for (c of categories(); track c.id) {
            <a class="chip" routerLink="/catalog" [queryParams]="{ category: c.id }">{{ c.name }}</a>
          }
        </div>
      </section>
    }

    @if (featured().length) {
      <section class="container" aria-label="Destacados">
        <div class="section-title">
          <h2>Lo nuevo en FashionStore</h2>
          <a class="btn btn-ghost btn-sm" routerLink="/catalog">Ver todo →</a>
        </div>
        <div class="product-grid">
          @for (p of featured(); track p.id) {
            <a class="product-card" routerLink="/catalog/{{ p.id }}">
              <div class="product-art">{{ p.name.charAt(0) }}</div>
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
      </section>
    }

    <section class="container values" aria-label="Nuestros valores">
      <div class="value-item">
        <span class="value-icon">✦</span>
        <h3>Calidad seleccionada</h3>
        <p class="muted small">Cada prenda es elegida con intención para durar temporada tras temporada.</p>
      </div>
      <div class="value-item">
        <span class="value-icon">◉</span>
        <h3>Disponible en tiendas</h3>
        <p class="muted small">Consulta el stock en tu sucursal favorita antes de visitarnos.</p>
      </div>
      <div class="value-item">
        <span class="value-icon">↺</span>
        <h3>Cuidado en cada detalle</h3>
        <p class="muted small">Reservas, compras y atención personalizada, todo desde tu cuenta.</p>
      </div>
    </section>
  `,
  styles: [`
    .hero { padding: 48px 0 64px; }
    .hero-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
      gap: clamp(28px, 6vw, 72px);
      align-items: center;
    }
    .hero h1 {
      margin: 6px 0 0;
      font-size: clamp(3rem, 8vw, 5.6rem);
      font-weight: 400;
      letter-spacing: -0.045em;
      line-height: 0.95;
    }
    .hero-lead {
      max-width: 420px;
      margin: 22px 0 0;
      color: var(--muted);
      font-size: 1.08rem;
      line-height: 1.7;
    }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
    .hero-art {
      position: relative;
      min-height: clamp(300px, 42vw, 460px);
      overflow: hidden;
      border-radius: 18px;
      background: var(--sage);
    }
    .art { position: absolute; transform: rotate(12deg); }
    .art-main {
      width: 64%; height: 82%; right: 16%; bottom: -8%;
      background: var(--accent);
      border-radius: 48% 48% 5% 5%;
    }
    .art-main::before, .art-main::after {
      content: ''; position: absolute; top: 2%; width: 23%; height: 47%; background: #d87858;
    }
    .art-main::before { left: -16%; transform: rotate(24deg); transform-origin: top right; }
    .art-main::after { right: -16%; transform: rotate(-24deg); transform-origin: top left; }
    .art-small {
      width: 33%; height: 44%; top: 8%; left: 9%;
      background: var(--beige);
      border-radius: 50% 50% 8% 8%;
      transform: rotate(-20deg);
    }
    .art-label {
      position: absolute; right: 7%; top: 7%;
      color: var(--ink);
      font-size: 0.68rem; font-weight: 800; letter-spacing: 0.2em; line-height: 1.4; text-align: right;
    }
    .band { padding: 12px 0 28px; }
    .chip-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
    .chip {
      padding: 9px 18px; border: 1px solid var(--line-strong); border-radius: 999px;
      background: var(--white); color: var(--ink); font-weight: 600; font-size: 0.88rem;
      text-decoration: none; transition: all 160ms ease;
    }
    .chip:hover { background: var(--ink); color: var(--paper); border-color: var(--ink); }
    .product-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 20px; margin-top: 18px;
    }
    .product-card {
      display: flex; flex-direction: column;
      border: 1px solid var(--line); border-radius: var(--radius);
      background: var(--white); box-shadow: var(--shadow-1);
      overflow: hidden; color: var(--ink); text-decoration: none;
      transition: transform 180ms ease, box-shadow 180ms ease;
    }
    .product-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-2); }
    .product-art {
      display: grid; place-items: center; aspect-ratio: 4 / 3;
      background: linear-gradient(135deg, var(--sage) 0%, var(--sage-2) 100%);
      font-family: var(--font-display); font-size: 3.2rem; color: var(--accent);
    }
    .product-body { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px 16px; }
    .product-brand {
      font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.1em; color: var(--muted-2);
    }
    .product-price { font-weight: 700; color: var(--ink); }
    .product-name { margin: 0; font-size: 1.05rem; }
    .values {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 18px; margin-top: 56px;
    }
    .value-item { padding: 22px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--white); }
    .value-item h3 { margin: 8px 0 6px; font-size: 1.05rem; }
    .value-item p { margin: 0; }
    .value-icon { font-size: 1.4rem; color: var(--accent); }
    @media (max-width: 860px) {
      .hero-grid { grid-template-columns: 1fr; gap: 36px; }
      .hero-art { min-height: 300px; }
    }
  `]
})
export class HomePage {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly year = new Date().getFullYear();
  readonly categories = signal<CategoryResponse[]>([]);
  readonly featured = signal<ProductResponse[]>([]);

  constructor() {
    this.api.list<CategoryResponse>('parameters/categories').subscribe({
      next: (v) => this.categories.set(v.slice(0, 6))
    });
    this.api.list<ProductResponse>('products').subscribe({
      next: (v) => this.featured.set(v.filter((p) => p.is_active).slice(0, 4))
    });
  }

  user() {
    return this.auth.currentUser();
  }
}