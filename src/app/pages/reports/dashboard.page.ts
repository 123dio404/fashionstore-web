import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ReportsService } from '../../core/services/reports.service';
import { DashboardResponse } from '../../models';

interface TopProduct {
  name: string;
  units: number;
  revenue: number;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Dashboard gerencial</h2>

    <div class="toolbar">
      <div class="field">
        <label for="start">Desde</label>
        <input id="start" type="date" [(ngModel)]="startDate" />
      </div>
      <div class="field">
        <label for="end">Hasta</label>
        <input id="end" type="date" [(ngModel)]="endDate" />
      </div>
      <button class="btn-primary" (click)="load()">Actualizar</button>
    </div>

    @if (loading()) {
      <p class="muted">Cargando...</p>
    }
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (data(); as report) {
      <div class="grid-2" style="margin-bottom: 1rem">
        <div class="stat">
          <div class="value">{{ report.total_orders }}</div>
          <div class="label">Órdenes</div>
        </div>
        <div class="stat">
          <div class="value">{{ report.total_units }}</div>
          <div class="label">Unidades vendidas</div>
        </div>
        <div class="stat">
          <div class="value">{{ report.total_revenue | currency: 'USD' }}</div>
          <div class="label">Ingresos</div>
        </div>
        <div class="stat">
          <div class="value">{{ report.average_order_value | currency: 'USD' }}</div>
          <div class="label">Ticket promedio</div>
        </div>
        <div class="stat">
          <div class="value">{{ report.inventory_value | currency: 'USD' }}</div>
          <div class="label">Valor de inventario</div>
        </div>
        <div class="stat">
          <div class="value">{{ report.low_stock_count }}</div>
          <div class="label">Productos bajo mínimo</div>
        </div>
      </div>

      <div class="card">
        <h3>Productos más vendidos</h3>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Unidades</th>
              <th>Ingresos</th>
            </tr>
          </thead>
          <tbody>
            @for (product of topProducts(); track product.name) {
              <tr>
                <td>{{ product.name }}</td>
                <td>{{ product.units }}</td>
                <td>{{ product.revenue | currency: 'USD' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>Canales</h3>
        <table>
          <thead>
            <tr>
              <th>Canal</th>
              <th>Órdenes</th>
              <th>Unidades</th>
              <th>Ingresos</th>
            </tr>
          </thead>
          <tbody>
            @for (row of report.channels; track row.key) {
              <tr>
                <td>{{ row.key }}</td>
                <td>{{ row.orders }}</td>
                <td>{{ row.units }}</td>
                <td>{{ row.revenue | currency: 'USD' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class DashboardPage {
  private readonly reports = inject(ReportsService);

  startDate = '';
  endDate = '';
  readonly data = signal<DashboardResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly topProducts = computed<TopProduct[]>(() =>
    (this.data()?.top_products ?? []).map((item) => ({
      name: String(item['name'] ?? item['product_name'] ?? item['product_id'] ?? 'N/A'),
      units: Number(item['units'] ?? item['units_sold'] ?? 0),
      revenue: Number(item['revenue'] ?? 0)
    }))
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reports.dashboard(this.startDate || undefined, this.endDate || undefined).subscribe({
      next: (report) => {
        this.data.set(report);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}
