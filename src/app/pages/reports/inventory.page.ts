import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { downloadCsv } from '../../core/export';
import { BranchesService } from '../../core/services/branches.service';
import { ReportsService } from '../../core/services/reports.service';
import { BranchResponse, InventoryReportResponse, InventoryReportRow } from '../../models';
import { ChartPoint, UiChartComponent } from '../../shared/ui/chart.component';
import { UiErrorComponent } from '../../shared/ui/error-state.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';

/** CU22 — Reporte de inventario: KPIs, alertas por sucursal y detalle exportable del stock. */
@Component({
  selector: 'app-inventory-report-page',
  imports: [CommonModule, FormsModule, UiChartComponent, UiErrorComponent, UiSkeletonComponent],
  templateUrl: './inventory.page.html',
  styleUrl: './reports.scss'
})
export class InventoryReportPage {
  private readonly reports = inject(ReportsService);
  private readonly branchesService = inject(BranchesService);

  readonly data = signal<InventoryReportResponse | null>(null);
  readonly branches = signal<BranchResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  search = '';
  lowOnly = false;

  readonly filtered = computed<InventoryReportRow[]>(() => {
    const term = this.search.trim().toLowerCase();
    return (this.data()?.stock ?? []).filter((row) => {
      if (this.lowOnly && !row.below_minimum) return false;
      if (!term) return true;
      return row.product_name.toLowerCase().includes(term);
    });
  });

  /** Unidades disponibles agrupadas por prenda (top 10 por volumen). */
  readonly productPoints = computed<ChartPoint[]>(() => {
    const totals = new Map<string, number>();
    for (const row of this.data()?.stock ?? []) {
      totals.set(row.product_name, (totals.get(row.product_name) ?? 0) + row.available_stock);
    }
    return [...totals.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  });

  /** Unidades bajo mínimo agrupadas por sucursal. */
  readonly branchPoints = computed<ChartPoint[]>(() => {
    const totals = new Map<number, number>();
    for (const row of this.data()?.stock ?? []) {
      if (!row.below_minimum) continue;
      totals.set(row.branch_id, (totals.get(row.branch_id) ?? 0) + (row.min_stock - row.available_stock));
    }
    return [...totals.entries()]
      .map(([branchId, value]) => ({ label: this.branchName(branchId), value }))
      .sort((a, b) => b.value - a.value);
  });

  constructor() {
    this.branchesService.list().subscribe((items) => this.branches.set(items));
    this.load();
  }

  branchName(branchId: number): string {
    return this.branches().find((branch) => branch.id === branchId)?.name ?? `#${branchId}`;
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

  exportCsv(): void {
    downloadCsv(`inventario_${new Date().toISOString().slice(0, 10)}`, this.filtered().map((row) => ({
      prenda: row.product_name,
      sucursal: this.branchName(row.branch_id),
      variante: row.variant_id,
      fisico: row.physical_stock,
      reservado: row.reserved_stock,
      disponible: row.available_stock,
      minimo: row.min_stock,
      alerta: row.below_minimum ? 'bajo minimo' : 'ok'
    })));
  }
}
