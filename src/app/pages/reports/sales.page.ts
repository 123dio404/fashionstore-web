import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { downloadCsv } from '../../core/export';
import { ReportsService } from '../../core/services/reports.service';
import { SalesReportResponse } from '../../models';
import { ChartPoint, UiChartComponent } from '../../shared/ui/chart.component';
import { UiErrorComponent } from '../../shared/ui/error-state.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';

/** CU21 — Reporte de ventas: KPIs, gráficos por día/sucursal, detalle por canal y exportación. */
@Component({
  selector: 'app-sales-report-page',
  imports: [CommonModule, FormsModule, UiChartComponent, UiErrorComponent, UiSkeletonComponent],
  templateUrl: './sales.page.html',
  styleUrl: './reports.scss'
})
export class SalesReportPage {
  private readonly reports = inject(ReportsService);

  readonly data = signal<SalesReportResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  startDate = '';
  endDate = '';

  readonly dayPoints = computed<ChartPoint[]>(() =>
    (this.data()?.by_day ?? []).map((row) => ({ label: row.key, value: Number(row.revenue) }))
  );

  readonly branchPoints = computed<ChartPoint[]>(() =>
    (this.data()?.by_branch ?? []).map((row) => ({ label: row.key, value: Number(row.revenue) }))
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reports.salesReport(this.startDate || undefined, this.endDate || undefined).subscribe({
      next: (report) => {
        this.data.set(report);
        this.startDate = report.start_date;
        this.endDate = report.end_date;
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  /** Atajos de rango: hoy, últimos 7 días y últimos 30 días. */
  range(kind: 'today' | 'week' | 'month'): void {
    const today = new Date();
    const from = new Date(today);
    if (kind === 'week') from.setDate(today.getDate() - 6);
    if (kind === 'month') from.setDate(today.getDate() - 29);
    this.startDate = from.toISOString().slice(0, 10);
    this.endDate = today.toISOString().slice(0, 10);
    this.load();
  }

  exportCsv(): void {
    const report = this.data();
    if (!report) return;
    downloadCsv(`ventas_${report.start_date}_${report.end_date}`, [
      ...report.by_day.map((row) => ({ seccion: 'dia', clave: row.key, ordenes: row.orders, unidades: row.units, ingresos: row.revenue })),
      ...report.by_branch.map((row) => ({ seccion: 'sucursal', clave: row.key, ordenes: row.orders, unidades: row.units, ingresos: row.revenue })),
      ...report.by_channel.map((row) => ({ seccion: 'canal', clave: row.key, ordenes: row.orders, unidades: row.units, ingresos: row.revenue }))
    ]);
  }
}
