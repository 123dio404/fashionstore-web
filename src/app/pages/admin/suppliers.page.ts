import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BranchesService } from '../../core/services/branches.service';
import { ProductsService } from '../../core/services/products.service';
import { SuppliersService } from '../../core/services/suppliers.service';
import { BranchResponse, ProductResponse, PurchaseOrderCreate, SupplierCreate, SupplierResponse } from '../../models';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { UiDrawerComponent } from '../../shared/ui/drawer.component';

const EMPTY_SUPPLIER: SupplierCreate = {
  name: '',
  ci: '',
  phone: '',
  email: '',
  address: '',
  is_active: true
};

/** CU07 — Gestionar proveedores y compras/notas de recepción para reposición de inventario. */
@Component({
  selector: 'app-suppliers-page',
  imports: [CommonModule, FormsModule, UiDrawerComponent],
  templateUrl: './suppliers.page.html'
})
export class SuppliersPage {
  private readonly service = inject(SuppliersService);
  private readonly branchesService = inject(BranchesService);
  private readonly productsService = inject(ProductsService);
  private readonly confirm = inject(ConfirmService);

  readonly list = signal<SupplierResponse[]>([]);
  readonly branches = signal<BranchResponse[]>([]);
  readonly products = signal<ProductResponse[]>([]);
  readonly drawerOpen = signal(false);
  readonly purchaseDrawerOpen = signal(false);
  readonly editing = signal<SupplierResponse | null>(null);
  readonly selectedSupplier = signal<SupplierResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  search = '';
  form: SupplierCreate = { ...EMPTY_SUPPLIER };

  purchaseForm: PurchaseOrderCreate = {
    branch_id: 1,
    invoice_number: '',
    notes: 'Ingreso de mercadería por factura de proveedor',
    items: [
      { variant_id: 1, quantity: 10, unit_cost: 45.0 }
    ]
  };

  get filtered(): SupplierResponse[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.list();
    return this.list().filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(term) ||
        supplier.ci.toLowerCase().includes(term) ||
        (supplier.email ?? '').toLowerCase().includes(term)
    );
  }

  constructor() {
    this.load();
    this.branchesService.list().subscribe((b) => this.branches.set(b));
    this.productsService.list().subscribe((p) => this.products.set(p));
  }

  initial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  load(): void {
    this.service.list().subscribe({
      next: (data) => this.list.set(data),
      error: (err: Error) => this.fail(err)
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form = { ...EMPTY_SUPPLIER };
    this.drawerOpen.set(true);
  }

  openEdit(supplier: SupplierResponse): void {
    this.editing.set(supplier);
    this.form = {
      name: supplier.name,
      ci: supplier.ci,
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      is_active: supplier.is_active
    };
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editing.set(null);
  }

  openPurchase(supplier: SupplierResponse): void {
    this.selectedSupplier.set(supplier);
    const defaultBranchId = this.branches().length > 0 ? Number(this.branches()[0].id) : 1;
    this.purchaseForm = {
      branch_id: defaultBranchId,
      invoice_number: `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: `Ingreso de mercadería por factura de proveedor ${supplier.name}`,
      items: [
        { variant_id: 1, quantity: 12, unit_cost: 50.0 }
      ]
    };
    this.purchaseDrawerOpen.set(true);
    this.message.set(null);
    this.error.set(null);
  }

  closePurchaseDrawer(): void {
    this.purchaseDrawerOpen.set(false);
    this.selectedSupplier.set(null);
  }

  addPurchaseItem(): void {
    this.purchaseForm.items.push({
      variant_id: 1,
      quantity: 6,
      unit_cost: 40.0
    });
  }

  removePurchaseItem(index: number): void {
    if (this.purchaseForm.items.length > 1) {
      this.purchaseForm.items.splice(index, 1);
    }
  }

  calculatePurchaseTotal(): number {
    return this.purchaseForm.items.reduce((acc, it) => acc + (it.quantity * it.unit_cost), 0);
  }

  submitPurchase(): void {
    const supplier = this.selectedSupplier();
    if (!supplier) return;

    if (!this.purchaseForm.invoice_number?.trim()) {
      this.fail(new Error('El número de factura / nota de ingreso es obligatorio.'));
      return;
    }

    if (this.purchaseForm.items.length === 0) {
      this.fail(new Error('Debe agregar al menos una prenda para el ingreso de mercadería.'));
      return;
    }

    this.service.registerPurchase(Number(supplier.id), this.purchaseForm).subscribe({
      next: (res) => {
        this.message.set(`¡${res.message}! Se incrementó el inventario físico con ${res.total_items} prendas (Total: Bs. ${res.total_amount}).`);
        this.closePurchaseDrawer();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  save(): void {
    if (!this.form.name.trim() || !this.form.ci.trim()) {
      this.fail(new Error('Nombre y CI/NIT son obligatorios.'));
      return;
    }

    const current = this.editing();
    const request$ = current
      ? this.service.update(current.id, this.form)
      : this.service.create(this.form);

    request$.subscribe({
      next: () => {
        this.message.set(current ? 'Proveedor actualizado.' : 'Proveedor creado.');
        this.error.set(null);
        this.closeDrawer();
        this.load();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  toggleActive(supplier: SupplierResponse): void {
    this.service.update(supplier.id, { is_active: !supplier.is_active }).subscribe({
      next: () => {
        this.message.set(supplier.is_active ? 'Proveedor desactivado.' : 'Proveedor activado.');
        this.load();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  remove(supplier: SupplierResponse): void {
    void this.confirm
      .ask({
        title: 'Eliminar proveedor',
        message: `¿Eliminar "${supplier.name}"? Si tiene movimientos asociados el sistema lo impedirá.`,
        confirmLabel: 'Sí, eliminar',
        danger: true
      })
      .then((confirmed) => {
        if (!confirmed) return;
        this.service.remove(supplier.id).subscribe({
          next: () => {
            this.message.set('Proveedor eliminado.');
            this.load();
          },
          error: (err: Error) => this.fail(err)
        });
      });
  }

  private fail(err: Error): void {
    this.error.set(err.message);
    this.message.set(null);
  }
}
