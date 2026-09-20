import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SuppliersService } from '../../core/services/suppliers.service';
import { SupplierCreate, SupplierResponse } from '../../models';
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

/** CU07 — Gestionar proveedores: tabla con búsqueda y drawer de alta/edición. */
@Component({
  selector: 'app-suppliers-page',
  imports: [CommonModule, FormsModule, UiDrawerComponent],
  templateUrl: './suppliers.page.html'
})
export class SuppliersPage {
  private readonly service = inject(SuppliersService);
  private readonly confirm = inject(ConfirmService);

  readonly list = signal<SupplierResponse[]>([]);
  readonly drawerOpen = signal(false);
  readonly editing = signal<SupplierResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  search = '';
  form: SupplierCreate = { ...EMPTY_SUPPLIER };

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
