import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ReportsService } from '../../core/services/reports.service';
import { PurchaseHistoryResponse } from '../../models';

@Component({
  selector: 'app-purchase-history-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Historial de compras</h2>

    <div class="toolbar">
      <div class="field">
        <label for="start">Desde</label>
        <input id="start" type="date" [(ngModel)]="startDate" />
      </div>
      <div class="field">
        <label for="end">Hasta</label>
        <input id="end" type="date" [(ngModel)]="endDate" />
      </div>
      <button class="btn-primary" (click)="load()">Filtrar</button>
    </div>

    @if (loading()) {
      <p class="muted">Cargando...</p>
    }
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (history(); as data) {
      <div class="grid-2" style="margin-bottom: 1rem">
        <div class="stat">
          <div class="value">{{ data.total_orders }}</div>
          <div class="label">Pedidos</div>
        </div>
        <div class="stat">
          <div class="value">{{ data.total_spent | currency: 'USD' }}</div>
          <div class="label">Total gastado</div>
        </div>
      </div>

      @if (data.purchases.length === 0) {
        <p class="muted">No hay compras registradas.</p>
      }

      @for (entry of data.purchases; track entry.sale_id) {
        <div class="card">
          <div class="row">
            <strong>Orden #{{ entry.sale_id }}</strong>
            <span class="badge">{{ entry.sale_type }}</span>
            <span class="spacer"></span>
            <span class="muted">{{ entry.sale_date | date: 'short' }}</span>
            <strong>{{ entry.total | currency: 'USD' }}</strong>
          </div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              @for (item of entry.items; track item.variant_id) {
                <tr>
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.unit_price | currency: 'USD' }}</td>
                  <td>{{ item.subtotal | currency: 'USD' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }
  `
})
export class PurchaseHistoryPage {
  private readonly reports = inject(ReportsService);

  startDate = '';
  endDate = '';
  readonly history = signal<PurchaseHistoryResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reports
      .purchaseHistory({
        startDate: this.startDate || undefined,
        endDate: this.endDate || undefined
      })
      .subscribe({
        next: (data) => {
          this.history.set(data);
          this.loading.set(false);
        },
        error: (err: Error) => {
          this.error.set(err.message);
          this.loading.set(false);
        }
      });
  }
}
