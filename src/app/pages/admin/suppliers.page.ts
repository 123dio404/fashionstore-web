import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SuppliersService } from '../../core/services/suppliers.service';
import { SupplierCreate, SupplierResponse } from '../../models';

@Component({
  selector: 'app-suppliers-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Proveedores</h2>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (message()) {
      <p class="success">{{ message() }}</p>
    }

    <div class="card">
      <h3>{{ editingId() ? 'Editar proveedor #' + editingId() : 'Nuevo proveedor' }}</h3>
      <div class="grid-2">
        <div>
          <label for="name">Nombre / Razón social</label>
          <input id="name" [(ngModel)]="form.name" />
        </div>
        <div>
          <label for="ci">CI / NIT</label>
          <input id="ci" [(ngModel)]="form.ci" />
        </div>
        <div>
          <label for="phone">Teléfono</label>
          <input id="phone" [(ngModel)]="form.phone" />
        </div>
        <div>
          <label for="email">Correo</label>
          <input id="email" type="email" [(ngModel)]="form.email" />
        </div>
        <div>
          <label for="address">Dirección</label>
          <input id="address" [(ngModel)]="form.address" />
        </div>
      </div>
      <br />
      <button class="btn-primary" (click)="save()">
        {{ editingId() ? 'Guardar cambios' : 'Crear proveedor' }}
      </button>
      @if (editingId()) {
        <button class="btn" (click)="reset()">Cancelar</button>
      }
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>CI / NIT</th>
            <th>Teléfono</th>
            <th>Correo</th>
            <th>Dirección</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (supplier of list(); track supplier.id) {
            <tr>
              <td>{{ supplier.id }}</td>
              <td>{{ supplier.name }}</td>
              <td>{{ supplier.ci }}</td>
              <td>{{ supplier.phone || '-' }}</td>
              <td>{{ supplier.email || '-' }}</td>
              <td>{{ supplier.address || '-' }}</td>
              <td>
                <span class="badge" [class.ok]="supplier.is_active">
                  {{ supplier.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <button class="btn" (click)="edit(supplier)">Editar</button>
                <button class="btn" (click)="toggleActive(supplier)">
                  {{ supplier.is_active ? 'Desactivar' : 'Activar' }}
                </button>
                <button class="btn-danger" (click)="remove(supplier)">Eliminar</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class SuppliersPage {
  private readonly service = inject(SuppliersService);

  readonly list = signal<SupplierResponse[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  form: SupplierCreate = this.empty();

  constructor() {
    this.load();
  }

  private empty(): SupplierCreate {
    return { name: '', ci: '', phone: '', email: '', address: '', is_active: true };
  }

  private fail(err: Error): void {
    this.error.set(err.message);
    this.message.set(null);
  }

  load(): void {
    this.service.list().subscribe({
      next: (data) => this.list.set(data),
      error: (err: Error) => this.fail(err)
    });
  }

  edit(supplier: SupplierResponse): void {
    this.editingId.set(supplier.id);
    this.form = {
      name: supplier.name,
      ci: supplier.ci,
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      is_active: supplier.is_active
    };
  }

  reset(): void {
    this.editingId.set(null);
    this.form = this.empty();
  }

  save(): void {
    if (!this.form.name.trim() || !this.form.ci.trim()) {
      this.fail(new Error('Nombre y CI/NIT son obligatorios.'));
      return;
    }
    const id = this.editingId();
    const request$ = id
      ? this.service.update(id, this.form)
      : this.service.create(this.form);
    request$.subscribe({
      next: () => {
        this.message.set(id ? 'Proveedor actualizado.' : 'Proveedor creado.');
        this.error.set(null);
        this.reset();
        this.load();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  toggleActive(supplier: SupplierResponse): void {
    this.service.update(supplier.id, { is_active: !supplier.is_active }).subscribe({
      next: () => this.load(),
      error: (err: Error) => this.fail(err)
    });
  }

  remove(supplier: SupplierResponse): void {
    this.service.remove(supplier.id).subscribe({
      next: () => this.load(),
      error: (err: Error) => this.fail(err)
    });
  }
}
