import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../core/services/api.service';
import { MovementResponse, ProductResponse, BranchResponse, UserResponse, SupplierResponse } from '../models';

@Component({
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="container page">
      <div class="page-head">
        <p class="eyebrow">Panel de administración</p>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-lead">Resumen general de la tienda. Explora cada módulo desde aquí.</p>
      </div>

      <div class="stat-grid">
        <a class="stat-card" routerLink="/admin/management/products">
          <span class="stat-label">Productos</span>
          <span class="stat-value">{{ stats().products }}</span>
          <span class="stat-sub">Ver productos</span>
        </a>
        <a class="stat-card" routerLink="/admin/management/branches">
          <span class="stat-label">Sucursales</span>
          <span class="stat-value">{{ stats().branches }}</span>
          <span class="stat-sub">Ver sucursales</span>
        </a>
        <a class="stat-card" routerLink="/admin/management/users">
          <span class="stat-label">Usuarios</span>
          <span class="stat-value">{{ stats().users }}</span>
          <span class="stat-sub">Ver usuarios</span>
        </a>
        <a class="stat-card" routerLink="/admin/management/suppliers">
          <span class="stat-label">Proveedores</span>
          <span class="stat-value">{{ stats().suppliers }}</span>
          <span class="stat-sub">Ver proveedores</span>
        </a>
        <a class="stat-card" routerLink="/admin/inventory">
          <span class="stat-label">Inventario</span>
          <span class="stat-value">→</span>
          <span class="stat-sub">Gestionar stock</span>
        </a>
        <a class="stat-card" routerLink="/admin/finance">
          <span class="stat-label">Finanzas</span>
          <span class="stat-value">→</span>
          <span class="stat-sub">Cuotas, multas y pagos</span>
        </a>
      </div>

      <section class="card mt-3">
        <div class="card-head">
          <h3>Accesos rápidos por módulo</h3>
        </div>
        <div class="quick-grid">
          <a class="quick-link" routerLink="/admin/inventory">Inventario</a>
          <a class="quick-link" routerLink="/admin/sales">Ventas (POS)</a>
          <a class="quick-link" routerLink="/admin/finance">Finanzas</a>
          <a class="quick-link" routerLink="/admin/operations">Operaciones</a>
          <a class="quick-link" routerLink="/admin/management/categories">Categorías</a>
          <a class="quick-link" routerLink="/admin/management/seasons">Temporadas</a>
          <a class="quick-link" routerLink="/admin/management/sizes">Tallas</a>
          <a class="quick-link" routerLink="/admin/management/colors">Colores</a>
          <a class="quick-link" routerLink="/admin/management/cities">Ciudades</a>
          <a class="quick-link" routerLink="/admin/management/branches">Sucursales</a>
          <a class="quick-link" routerLink="/admin/management/suppliers">Proveedores</a>
          <a class="quick-link" routerLink="/admin/management/products">Productos</a>
          <a class="quick-link" routerLink="/admin/management/users">Usuarios</a>
        </div>
      </section>

      <section class="card mt-3">
        <div class="card-head">
          <h3>Movimientos recientes</h3>
          <a class="btn btn-ghost btn-sm" routerLink="/admin/inventory">Ver todo →</a>
        </div>
        @if (movementsLoading()) {
          <div class="loading-row"><span class="spinner"></span></div>
        }
        @if (!movementsLoading() && movements().length) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Variante</th>
                  <th>Cantidad</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                @for (m of movements().slice(0, 10); track m.id) {
                  <tr>
                    <td><span class="badge badge-accent">{{ m.movement_type }}</span></td>
                    <td>{{ m.variant_id }}</td>
                    <td class="strong">{{ m.quantity }}</td>
                    <td class="small muted-2">{{ m.created_at | date:'short' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        @if (!movementsLoading() && !movements().length) {
          <div class="empty">
            <div class="empty-icon">📭</div>
            <h3>Sin movimientos</h3>
            <p>Aún no hay movimientos de inventario registrados.</p>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .stat-card {
      display: flex; flex-direction: column; gap: 4px;
      color: var(--ink); text-decoration: none;
      transition: transform 160ms ease, box-shadow 160ms ease;
    }
    .stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-2); }

    .quick-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
    }
    .quick-link {
      display: flex;
      align-items: center;
      padding: 12px 14px;
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 12px;
      color: var(--ink);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: border-color 150ms ease, background 150ms ease;
    }
    .quick-link:hover {
      border-color: var(--accent);
      background: var(--accent-soft);
    }
  `]
})
export class AdminDashboardPage {
  private readonly api = inject(ApiService);

  readonly stats = signal({ products: 0, branches: 0, users: 0, suppliers: 0 });
  readonly movements = signal<MovementResponse[]>([]);
  readonly movementsLoading = signal(true);

  constructor() {
    this.api.list<ProductResponse>('products').subscribe({ next: (v) => this.stats.update((s) => ({ ...s, products: v.length })) });
    this.api.list<BranchResponse>('branches').subscribe({ next: (v) => this.stats.update((s) => ({ ...s, branches: v.length })) });
    this.api.list<UserResponse>('users').subscribe({ next: (v) => this.stats.update((s) => ({ ...s, users: v.length })) });
    this.api.list<SupplierResponse>('suppliers').subscribe({ next: (v) => this.stats.update((s) => ({ ...s, suppliers: v.length })) });
    this.api.list<MovementResponse>('inventory/movements').subscribe({
      next: (v) => { this.movements.set(v); this.movementsLoading.set(false); },
      error: () => this.movementsLoading.set(false)
    });
  }
}