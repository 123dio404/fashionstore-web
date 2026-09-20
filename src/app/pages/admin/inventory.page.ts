import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BranchesService } from '../../core/services/branches.service';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductsService } from '../../core/services/products.service';
import { BranchResponse, MovementResponse, StockResponse, VariantResponse } from '../../models';
import { UiDrawerComponent } from '../../shared/ui/drawer.component';
import { TabItem, UiTabsComponent } from '../../shared/ui/tabs.component';

/** CU09 — Controlar inventario y movimientos: stock por sucursal, ingresos/ajustes y transferencias. */
@Component({
  selector: 'app-inventory-page',
  imports: [CommonModule, FormsModule, UiDrawerComponent, UiTabsComponent],
  templateUrl: './inventory.page.html'
})
export class InventoryPage {
  private readonly inventory = inject(InventoryService);
  private readonly branchesService = inject(BranchesService);
  private readonly productsService = inject(ProductsService);

  readonly branches = signal<BranchResponse[]>([]);
  readonly variants = signal<VariantResponse[]>([]);
  readonly stock = signal<StockResponse[]>([]);
  readonly movements = signal<MovementResponse[]>([]);
  /** variante → "Prenda · CÓDIGO" para no mostrar solo números. */
  private readonly variantLabels = signal<Map<number, string>>(new Map());
  readonly branchId = signal<number | null>(null);
  readonly drawerOpen = signal(false);
  readonly drawerTab = signal('adjust');
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  readonly drawerTabs: TabItem[] = [
    { id: 'adjust', label: 'Ingreso / ajuste' },
    { id: 'transfer', label: 'Transferencia' }
  ];

  search = '';
  lowOnly = false;

  adjustForm = { branch_id: 0, variant_id: 0, quantity: 1, reason: '' };
  transferForm = {
    variant_id: 0,
    source_branch_id: 0,
    destination_branch_id: 0,
    quantity: 1,
    reason: 'Reposición de tienda'
  };

  readonly filteredStock = computed<StockResponse[]>(() => {
    const term = this.search.trim().toLowerCase();
    return this.stock().filter((row) => {
      if (this.lowOnly && row.available_stock > 3) return false;
      if (!term) return true;
      return (
        this.variantLabel(row.variant_id).toLowerCase().includes(term) ||
        `stock #${row.id}`.includes(term) ||
        this.branchName(row.branch_id).toLowerCase().includes(term)
      );
    });
  });

  readonly totalAvailable = computed(() =>
    this.stock().reduce((total, row) => total + row.available_stock, 0)
  );

  readonly totalReserved = computed(() =>
    this.stock().reduce((total, row) => total + row.reserved_stock, 0)
  );

  readonly lowStockCount = computed(
    () => this.stock().filter((row) => row.available_stock <= 3).length
  );

  constructor() {
    this.branchesService.list().subscribe((data) => this.branches.set(data));
    this.productsService.list().subscribe((products) => {
      this.variants.set(products.flatMap((product) => product.variants));
      const labels = new Map<number, string>();
      for (const product of products) {
        for (const variant of product.variants) {
          labels.set(variant.id, `${product.name} · ${variant.codigo}`);
        }
      }
      this.variantLabels.set(labels);
    });
    this.reload();
  }

  variantLabel(variantId: number): string {
    return this.variantLabels().get(variantId) ?? `Variante #${variantId}`;
  }

  branchName(branchId: number): string {
    return this.branches().find((branch) => branch.id === branchId)?.name ?? `#${branchId}`;
  }

  onBranch(value: number | null): void {
    this.branchId.set(value);
    this.reload();
  }

  reload(): void {
    const branch = this.branchId() ?? undefined;
    this.inventory.listStock(branch).subscribe({
      next: (data) => this.stock.set(data),
      error: (err: Error) => this.fail(err)
    });
    this.inventory.listMovements(branch).subscribe({
      next: (data) => this.movements.set(data),
      error: (err: Error) => this.fail(err)
    });
  }

  openMovement(): void {
    this.adjustForm = {
      branch_id: this.branchId() ?? 0,
      variant_id: 0,
      quantity: 1,
      reason: ''
    };
    this.transferForm = {
      variant_id: 0,
      source_branch_id: this.branchId() ?? 0,
      destination_branch_id: 0,
      quantity: 1,
      reason: 'Reposición de tienda'
    };
    this.drawerTab.set('adjust');
    this.drawerOpen.set(true);
  }

  openAdjust(row: StockResponse): void {
    this.openMovement();
    this.adjustForm = {
      branch_id: row.branch_id,
      variant_id: row.variant_id,
      quantity: 1,
      reason: ''
    };
  }

  openTransfer(row: StockResponse): void {
    this.openMovement();
    this.drawerTab.set('transfer');
    this.transferForm = {
      variant_id: row.variant_id,
      source_branch_id: row.branch_id,
      destination_branch_id: 0,
      quantity: 1,
      reason: 'Reposición de tienda'
    };
  }

  submitAdjust(): void {
    if (!this.adjustForm.branch_id || !this.adjustForm.variant_id || !this.adjustForm.quantity) {
      this.fail(new Error('Sucursal, variante y una cantidad distinta de cero son obligatorias.'));
      return;
    }

    this.inventory
      .adjust({
        branch_id: this.adjustForm.branch_id,
        variant_id: this.adjustForm.variant_id,
        quantity: this.adjustForm.quantity,
        reason: this.adjustForm.reason || 'Ajuste desde la web'
      })
      .subscribe({
        next: () => {
          this.message.set('Movimiento registrado.');
          this.error.set(null);
          this.drawerOpen.set(false);
          this.reload();
        },
        error: (err: Error) => this.fail(err)
      });
  }

  submitTransfer(): void {
    const form = this.transferForm;
    if (!form.variant_id || !form.source_branch_id || !form.destination_branch_id) {
      this.fail(new Error('Variante y ambas sucursales son obligatorias.'));
      return;
    }
    if (form.source_branch_id === form.destination_branch_id) {
      this.fail(new Error('La sucursal de origen y destino deben ser distintas.'));
      return;
    }

    this.inventory
      .transfer({
        variant_id: form.variant_id,
        source_branch_id: form.source_branch_id,
        destination_branch_id: form.destination_branch_id,
        quantity: form.quantity,
        reason: form.reason || 'Transferencia desde la web'
      })
      .subscribe({
        next: () => {
          this.message.set('Transferencia registrada.');
          this.error.set(null);
          this.drawerOpen.set(false);
          this.reload();
        },
        error: (err: Error) => this.fail(err)
      });
  }

  private fail(err: Error): void {
    this.error.set(err.message);
    this.message.set(null);
  }
}
