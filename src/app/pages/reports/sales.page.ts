import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ReportsService } from '../../core/services/reports.service';
import { SalesReportResponse } from '../../models';

@Component({
  selector: 'app-sales-report-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Reporte de ventas</h2>

    <div class="toolbar">
      <div class="field">
        <label for="start">Desde</label>
        <input id="start" type="date" [(ngModel)]="startDate" />
      </div>
      <div class="field">
        <label for="end">Hasta</label>
        <input id="end" type="date" [(ngModel)]="endDate" />
      </div>
      <button class="btn-primary" (click)="load()">Generar reporte</button>
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
          <div class="label">Unidades</div>
        </div>
        <div class="stat">
          <div class="value">{{ report.total_revenue | currency: 'USD' }}</div>
          <div class="label">Ingresos</div>
        </div>
        <div class="stat">
          <div class="value">{{ report.average_order_value | currency: 'USD' }}</div>
          <div class="label">Ticket promedio</div>
        </div>
      </div>

      <div class="card">
        <h3>Por canal</h3>
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
            @for (row of report.by_channel; track row.key) {
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

      <div class="card">
        <h3>Por sucursal</h3>
        <table>
          <thead>
            <tr>
              <th>Sucursal</th>
              <th>Órdenes</th>
              <th>Unidades</th>
              <th>Ingresos</th>
            </tr>
          </thead>
          <tbody>
            @for (row of report.by_branch; track row.key) {
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

      <div class="card">
        <h3>Por día</h3>
        <table>
          <thead>
            <tr>
              <th>Día</th>
              <th>Órdenes</th>
              <th>Unidades</th>
              <th>Ingresos</th>
            </tr>
          </thead>
          <tbody>
            @for (row of report.by_day; track row.key) {
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
export class SalesReportPage {
  private readonly reports = inject(ReportsService);

  startDate = '';
  endDate = '';
  readonly data = signal<SalesReportResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reports.salesReport(this.startDate || undefined, this.endDate || undefined).subscribe({
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
