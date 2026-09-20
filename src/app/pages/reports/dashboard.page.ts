import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';

import { ReportsService } from '../../core/services/reports.service';
import { DashboardResponse, SalesReportResponse } from '../../models';
import { ChartPoint, UiChartComponent } from '../../shared/ui/chart.component';
import { UiErrorComponent } from '../../shared/ui/error-state.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';

interface TopProduct {
  name: string;
  units: number;
  revenue: number;
}

/** CU23 — Dashboard gerencial: KPIs, gráficos de ventas y tablas de productos y canales. */
@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule, FormsModule, UiChartComponent, UiErrorComponent, UiSkeletonComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './reports.scss'
})
export class DashboardPage {
  private readonly reports = inject(ReportsService);

  readonly data = signal<DashboardResponse | null>(null);
  private readonly sales = signal<SalesReportResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  startDate = '';
  endDate = '';

  readonly dayPoints = computed<ChartPoint[]>(() =>
    (this.sales()?.by_day ?? []).map((row) => ({ label: row.key, value: Number(row.revenue) }))
  );

  readonly branchPoints = computed<ChartPoint[]>(() =>
    (this.sales()?.by_branch ?? []).map((row) => ({ label: row.key, value: Number(row.revenue) }))
  );

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
    forkJoin({
      dashboard: this.reports.dashboard(this.startDate || undefined, this.endDate || undefined),
      sales: this.reports
        .salesReport(this.startDate || undefined, this.endDate || undefined)
        .pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ dashboard, sales }) => {
        this.data.set(dashboard);
        this.sales.set(sales);
        this.startDate = dashboard.start_date;
        this.endDate = dashboard.end_date;
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  range(days: number): void {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - (days - 1));
    this.startDate = from.toISOString().slice(0, 10);
    this.endDate = today.toISOString().slice(0, 10);
    this.load();
  }
}
