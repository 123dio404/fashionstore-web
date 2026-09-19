import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { ReportsService } from '../../core/services/reports.service';
import { InventoryReportResponse } from '../../models';

@Component({
  selector: 'app-inventory-report-page',
  imports: [CommonModule],
  template: `
    <h2>Reporte de inventario</h2>

    <button class="btn-primary" style="margin-bottom: 1rem" (click)="load()">Actualizar</button>

    @if (loading()) {
      <p class="muted">Cargando...</p>
    }
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (data(); as report) {
      <div class="grid-2" style="margin-bottom: 1rem">
        <div class="stat">
          <div class="value">{{ report.total_skus }}</div>
          <div class="label">SKUs</div>
        </div>
        <div class="stat">
          <div class="value">{{ report.total_physical_units }}</div>
          <div class="label">Unidades físicas</div>
        </div>
        <div class="stat">
          <div class="value">{{ report.total_available_units }}</div>
          <div class="label">Unidades disponibles</div>
        </div>
        <div class="stat">
          <div class="value">{{ report.low_stock_count }}</div>
          <div class="label">Bajo mínimo</div>
        </div>
      </div>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Sucursal</th>
              <th>Variante</th>
              <th>Físico</th>
              <th>Reservado</th>
              <th>Disponible</th>
              <th>Mínimo</th>
              <th>Alerta</th>
            </tr>
          </thead>
          <tbody>
            @for (row of report.stock; track row.stock_id) {
              <tr>
                <td>{{ row.product_name }}</td>
                <td>{{ row.branch_id }}</td>
                <td>#{{ row.variant_id }}</td>
                <td>{{ row.physical_stock }}</td>
                <td>{{ row.reserved_stock }}</td>
                <td>{{ row.available_stock }}</td>
                <td>{{ row.min_stock }}</td>
                <td>
                  @if (row.below_minimum) {
                    <span class="badge warn">Bajo mínimo</span>
                  } @else {
                    <span class="badge ok">OK</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class InventoryReportPage {
  private readonly reports = inject(ReportsService);

  readonly data = signal<InventoryReportResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reports.inventoryReport().subscribe({
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
