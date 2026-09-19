import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BranchesService } from '../../core/services/branches.service';
import { CommerceService } from '../../core/services/commerce.service';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth.service';
import { BranchResponse, SaleResponse, StockResponse } from '../../models';

@Component({
  selector: 'app-pos-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Punto de venta (POS)</h2>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (message()) {
      <p class="success">{{ message() }}</p>
    }

    <div class="card">
      <div class="grid-2">
        <div>
          <label for="branch">Sucursal</label>
          <select id="branch" [ngModel]="branchId()" (ngModelChange)="onBranch($event)">
            <option [ngValue]="null">Selecciona</option>
            @for (branch of branches(); track branch.id) {
              <option [ngValue]="branch.id">{{ branch.name }}</option>
            }
          </select>
        </div>
        <div>
          <label for="client">ID del cliente</label>
          <input id="client" type="number" min="1" [(ngModel)]="clientId" />
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Agregar artículos</h3>
      <div class="grid-2">
        <div>
          <label for="stock">Variante en stock</label>
          <select id="stock" [(ngModel)]="stockId">
            <option [ngValue]="0">Selecciona</option>
            @for (stock of stocks(); track stock.id) {
              <option [ngValue]="stock.id">
                #{{ stock.variant_id }} (disp. {{ stock.available_stock }})
              </option>
            }
          </select>
        </div>
        <div>
          <label for="qty">Cantidad</label>
          <input id="qty" type="number" min="1" [(ngModel)]="quantity" />
        </div>
      </div>
      <br />
      <button class="btn" (click)="addLine()">Agregar línea</button>

      <table style="margin-top: 1rem">
        <thead>
          <tr>
            <th>Stock</th>
            <th>Variante</th>
            <th>Cantidad</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (line of lines(); track line.stock_id; let i = $index) {
            <tr>
              <td>{{ line.stock_id }}</td>
              <td>#{{ variantOf(line.stock_id) }}</td>
              <td>{{ line.quantity }}</td>
              <td><button class="btn-danger" (click)="removeLine(i)">Quitar</button></td>
            </tr>
          }
        </tbody>
      </table>
      <p class="muted">Artículos: {{ lines().length }}</p>
      <button class="btn-primary" [disabled]="!canSubmit() || submitting()" (click)="submit()">
        {{ submitting() ? 'Registrando...' : 'Registrar venta' }}
      </button>
    </div>

    @if (sale(); as completed) {
      <div class="card">
        <h3>Venta registrada</h3>
        <p>Orden #{{ completed.id }} · Total {{ completed.total | currency: 'USD' }}</p>
        <p class="muted">Tipo: {{ completed.sale_type }} · Sucursal #{{ completed.branch_id }}</p>
      </div>
    }
  `
})
export class PosPage {
  private readonly branchesService = inject(BranchesService);
  private readonly inventory = inject(InventoryService);
  private readonly commerce = inject(CommerceService);
  private readonly auth = inject(AuthService);

  readonly branches = signal<BranchResponse[]>([]);
  readonly stocks = signal<StockResponse[]>([]);
  readonly lines = signal<Array<{ stock_id: number; quantity: number }>>([]);
  readonly branchId = signal<number | null>(null);
  readonly sale = signal<SaleResponse | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  clientId = this.auth.currentUser()?.id ?? 0;
  stockId = 0;
  quantity = 1;

  readonly canSubmit = computed(
    () => this.branchId() !== null && this.clientId > 0 && this.lines().length > 0
  );

  constructor() {
    this.branchesService.list().subscribe((d) => this.branches.set(d));
  }

  variantOf(stockId: number): number {
    return this.stocks().find((s) => s.id === stockId)?.variant_id ?? 0;
  }

  onBranch(branchId: number | null): void {
    this.branchId.set(branchId);
    this.lines.set([]);
    if (!branchId) {
      this.stocks.set([]);
      return;
    }
    this.inventory.listStock(branchId).subscribe({
      next: (d) => this.stocks.set(d.filter((s) => s.available_stock > 0)),
      error: (e: Error) => this.error.set(e.message)
    });
  }

  addLine(): void {
    if (!this.stockId || this.quantity < 1) {
      this.error.set('Selecciona una variante y una cantidad válida.');
      return;
    }
    this.error.set(null);
    const existing = this.lines().find((l) => l.stock_id === this.stockId);
    if (existing) {
      this.lines.set(
        this.lines().map((l) =>
          l.stock_id === this.stockId ? { ...l, quantity: l.quantity + this.quantity } : l
        )
      );
    } else {
      this.lines.set([...this.lines(), { stock_id: this.stockId, quantity: this.quantity }]);
    }
    this.stockId = 0;
    this.quantity = 1;
  }

  removeLine(index: number): void {
    this.lines.set(this.lines().filter((_, i) => i !== index));
  }

  submit(): void {
    const branchId = this.branchId();
    if (!branchId) return;
    this.submitting.set(true);
    this.error.set(null);
    this.commerce
      .posSale({
        branch_id: branchId,
        client_id: this.clientId,
        items: this.lines(),
        paid: true,
        payment_provider: 'stripe'
      })
      .subscribe({
        next: (sale) => {
          this.submitting.set(false);
          this.sale.set(sale);
          this.message.set('Venta POS registrada.');
          this.lines.set([]);
        },
        error: (e: Error) => {
          this.submitting.set(false);
          this.error.set(e.message);
        }
      });
  }
}
