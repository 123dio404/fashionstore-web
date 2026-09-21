import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ReportsService } from '../../core/services/reports.service';
import { PurchaseHistoryResponse } from '../../models';
import { UiEmptyComponent } from '../../shared/ui/empty-state.component';
import { UiErrorComponent } from '../../shared/ui/error-state.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';

/** CU16 — Historial de compras del cliente: KPIs, filtro por fechas y detalle por orden. */
@Component({
  selector: 'app-purchase-history-page',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UiEmptyComponent,
    UiErrorComponent,
    UiSkeletonComponent
  ],
  templateUrl: './purchase-history.page.html',
  styleUrl: './purchase-history.page.scss'
})
export class PurchaseHistoryPage {
  private readonly reports = inject(ReportsService);

  readonly history = signal<PurchaseHistoryResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  startDate = '';
  endDate = '';

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

  clear(): void {
    this.startDate = '';
    this.endDate = '';
    this.load();
  }

  /** Variante de badge por canal de venta (prototipo: digital verde, presencial azul). */
  typeBadge(saleType: string): string {
    return saleType === 'digital' ? 'ok' : 'info';
  }
}
