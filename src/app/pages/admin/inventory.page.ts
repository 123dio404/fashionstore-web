import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BranchesService } from '../../core/services/branches.service';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductsService } from '../../core/services/products.service';
import {
  BranchResponse,
  MovementResponse,
  StockResponse,
  VariantResponse
} from '../../models';

@Component({
  selector: 'app-inventory-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Inventario multisucursal</h2>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (message()) {
      <p class="success">{{ message() }}</p>
    }

    <div class="toolbar">
      <div class="field">
        <label for="branch">Sucursal</label>
        <select id="branch" [ngModel]="branchId" (ngModelChange)="onBranch($event)">
          <option [ngValue]="null">Todas</option>
          @for (branch of branches(); track branch.id) {
            <option [ngValue]="branch.id">{{ branch.name }}</option>
          }
        </select>
      </div>
      <button class="btn" (click)="reload()">Actualizar</button>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Ajuste / ingreso de stock</h3>
        <div class="field">
          <label for="abranch">Sucursal</label>
          <select id="abranch" [(ngModel)]="adjustment.branch_id">
            <option [ngValue]="0">Selecciona</option>
            @for (branch of branches(); track branch.id) {
              <option [ngValue]="branch.id">{{ branch.name }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="avariant">Variante</label>
          <select id="avariant" [(ngModel)]="adjustment.variant_id">
            <option [ngValue]="0">Selecciona</option>
            @for (variant of variants(); track variant.id) {
              <option [ngValue]="variant.id">{{ variant.codigo }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="aqty">Cantidad (negativo para baja)</label>
          <input id="aqty" type="number" [(ngModel)]="adjustment.quantity" />
        </div>
        <div class="field">
          <label for="areason">Motivo</label>
          <input id="areason" [(ngModel)]="adjustment.reason" />
        </div>
        <button class="btn-primary" (click)="adjust()">Registrar ajuste</button>
      </div>

      <div class="card">
        <h3>Transferencia entre sucursales</h3>
        <div class="field">
          <label for="tvariant">Variante</label>
          <select id="tvariant" [(ngModel)]="transfer.variant_id">
            <option [ngValue]="0">Selecciona</option>
            @for (variant of variants(); track variant.id) {
              <option [ngValue]="variant.id">{{ variant.codigo }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="tsource">Origen</label>
          <select id="tsource" [(ngModel)]="transfer.source_branch_id">
            <option [ngValue]="0">Selecciona</option>
            @for (branch of branches(); track branch.id) {
              <option [ngValue]="branch.id">{{ branch.name }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="tdest">Destino</label>
          <select id="tdest" [(ngModel)]="transfer.destination_branch_id">
            <option [ngValue]="0">Selecciona</option>
            @for (branch of branches(); track branch.id) {
              <option [ngValue]="branch.id">{{ branch.name }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="tqty">Cantidad</label>
          <input id="tqty" type="number" min="1" [(ngModel)]="transfer.quantity" />
        </div>
        <button class="btn-primary" (click)="doTransfer()">Transferir</button>
      </div>
    </div>

    <div class="card">
      <h3>Stock</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Sucursal</th>
            <th>Variante</th>
            <th>Físico</th>
            <th>Reservado</th>
            <th>Disponible</th>
          </tr>
        </thead>
        <tbody>
          @for (stock of stock(); track stock.id) {
            <tr>
              <td>{{ stock.id }}</td>
              <td>{{ stock.branch_id }}</td>
              <td>#{{ stock.variant_id }}</td>
              <td>{{ stock.physical_stock }}</td>
              <td>{{ stock.reserved_stock }}</td>
              <td>{{ stock.available_stock }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>Movimientos</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tipo</th>
            <th>Inventario</th>
            <th>Cantidad</th>
            <th>Motivo</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          @for (movement of movements(); track movement.id) {
            <tr>
              <td>{{ movement.id }}</td>
              <td><span class="badge">{{ movement.movement_type }}</span></td>
              <td>{{ movement.inventory_id }}</td>
              <td>{{ movement.quantity }}</td>
              <td>{{ movement.reason || '-' }}</td>
              <td>{{ movement.created_at | date: 'short' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class InventoryPage {
  private readonly inventory = inject(InventoryService);
  private readonly branchesService = inject(BranchesService);
  private readonly productsService = inject(ProductsService);

  readonly branches = signal<BranchResponse[]>([]);
  readonly variants = signal<VariantResponse[]>([]);
  readonly stock = signal<StockResponse[]>([]);
  readonly movements = signal<MovementResponse[]>([]);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  branchId: number | null = null;
  adjustment = { branch_id: 0, variant_id: 0, quantity: 1, reason: '' };
  transfer = { variant_id: 0, source_branch_id: 0, destination_branch_id: 0, quantity: 1 };

  constructor() {
    this.branchesService.list().subscribe((d) => this.branches.set(d));
    this.productsService.list().subscribe((d) => this.variants.set(d.flatMap((p) => p.variants)));
    this.reload();
  }

  private fail(err: Error): void {
    this.error.set(err.message);
    this.message.set(null);
  }

  onBranch(value: number | null): void {
    this.branchId = value;
    this.reload();
  }

  reload(): void {
    const branch = this.branchId ?? undefined;
    this.inventory.listStock(branch).subscribe({
      next: (d) => this.stock.set(d),
      error: (e: Error) => this.fail(e)
    });
    this.inventory.listMovements(branch).subscribe({
      next: (d) => this.movements.set(d),
      error: (e: Error) => this.fail(e)
    });
  }

  adjust(): void {
    if (!this.adjustment.branch_id || !this.adjustment.variant_id) {
      this.fail(new Error('Sucursal y variante son obligatorias.'));
      return;
    }
    this.inventory
      .adjust({
        branch_id: this.adjustment.branch_id,
        variant_id: this.adjustment.variant_id,
        quantity: this.adjustment.quantity,
        reason: this.adjustment.reason
      })
      .subscribe({
        next: () => {
          this.message.set('Ajuste registrado.');
          this.error.set(null);
          this.reload();
        },
        error: (e: Error) => this.fail(e)
      });
  }

  doTransfer(): void {
    const t = this.transfer;
    if (!t.variant_id || !t.source_branch_id || !t.destination_branch_id) {
      this.fail(new Error('Variante y ambas sucursales son obligatorias.'));
      return;
    }
    this.inventory
      .transfer({
        variant_id: t.variant_id,
        source_branch_id: t.source_branch_id,
        destination_branch_id: t.destination_branch_id,
        quantity: t.quantity,
        reason: 'Transferencia web'
      })
      .subscribe({
        next: () => {
          this.message.set('Transferencia registrada.');
          this.error.set(null);
          this.reload();
        },
        error: (e: Error) => this.fail(e)
      });
  }
}
