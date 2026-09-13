import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ApiService } from '../core/services/api.service';
import { CommerceService } from '../core/services/commerce.service';
import {
  BranchResponse,
  ProductResponse,
  SaleResponse,
  StockResponse,
  UserResponse
} from '../models';

interface StockOption {
  stockId: number;
  label: string;
  available: number;
}

interface LineItem {
  stockId: number;
  quantity: number;
  label: string;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="container page">
      <div class="page-head">
        <p class="eyebrow">Punto de venta</p>
        <h1 class="page-title">Ventas</h1>
        <p class="page-lead">Registra ventas en tienda y consulta el historial de ventas de la organización.</p>
      </div>

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }
      @if (message()) {
        <div class="alert alert-success">{{ message() }}</div>
      }

      <div class="admin-grid">
        <section class="card">
          <h3>Nueva venta (POS)</h3>
          <form [formGroup]="posForm">
            <div class="form-grid">
              <div class="form-field">
                <label>Sucursal</label>
                <select formControlName="branch_id">
                  @for (b of branches(); track b.id) {
                    <option [value]="b.id">{{ b.name }}</option>
                  }
                </select>
              </div>
              <div class="form-field">
                <label>Cliente</label>
                <select formControlName="client_id">
                  @for (c of clients(); track c.id) {
                    <option [value]="c.id">{{ c.full_name }} ({{ c.email }})</option>
                  }
                </select>
              </div>
              <div class="form-field">
                <label>Producto (stock)</label>
                <select formControlName="stock_id">
                  @for (s of stockOptions(); track s.stockId) {
                    <option [value]="s.stockId">{{ s.label }} · disp. {{ s.available }}</option>
                  }
                </select>
              </div>
              <div class="form-field">
                <label>Cantidad</label>
                <input type="number" formControlName="quantity" min="1" />
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-outline btn-sm" type="button" (click)="addLine()" [disabled]="!posForm.controls.stock_id.value || lineSaving()">
                + Agregar artículo
              </button>
              <label class="inline-check">
                <input type="checkbox" formControlName="paid" />
                <span>Pagado</span>
              </label>
            </div>
          </form>

          @if (lines().length) {
            <div class="lines mt-2">
              @for (line of lines(); track $index) {
                <div class="line-row">
                  <span class="truncate" style="max-width:60%">{{ line.label }}</span>
                  <span class="strong">× {{ line.quantity }}</span>
                  <button class="btn btn-ghost btn-sm" type="button" (click)="removeLine($index)">✕</button>
                </div>
              }
              <div class="form-actions">
                <button class="btn btn-primary" type="button" (click)="submitPos()" [disabled]="lineSaving() || !lines().length">
                  {{ lineSaving() ? 'Procesando…' : 'Registrar venta' }}
                </button>
              </div>
            </div>
          }
        </section>

        <section class="card">
          <div class="card-head">
            <h3>Historial de ventas</h3>
            <button class="btn btn-ghost btn-sm" type="button" (click)="load()">Actualizar</button>
          </div>
          @if (salesLoading()) {
            <div class="loading-row"><span class="spinner"></span> Cargando…</div>
          }
          @if (!salesLoading() && sales().length) {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Sucursal</th>
                    <th>Tipo</th>
                    <th>Total</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  @for (sale of sales(); track sale.id) {
                    <tr>
                      <td class="strong">{{ sale.id }}</td>
                      <td>{{ clientName(sale.client_id) }}</td>
                      <td>{{ branchName(sale.branch_id) }}</td>
                      <td>
                        @if (sale.sale_type === 'pos') {
                          <span class="badge badge-accent">POS</span>
                        } @else {
                          <span class="badge badge-info">Digital</span>
                        }
                      </td>
                      <td class="strong">{{ sale.total | currency }}</td>
                      <td class="small muted-2">{{ sale.sale_date | date:'short' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @if (!salesLoading() && !sales().length) {
            <div class="empty"><h3>Sin ventas</h3><p>Todavía no hay ventas registradas.</p></div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .admin-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
      gap: 20px;
      align-items: start;
    }
    .inline-check {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-top: 4px;
    }
    .lines { display: grid; gap: 8px; border-top: 1px solid var(--line); padding-top: 14px; }
    .line-row {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: space-between;
      padding: 8px 10px;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      background: var(--paper);
    }
    @media (max-width: 920px) {
      .admin-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SalesPage {
  private readonly api = inject(ApiService);
  private readonly commerce = inject(CommerceService);

  readonly branches = signal<BranchResponse[]>([]);
  readonly clients = signal<UserResponse[]>([]);
  readonly stockOptions = signal<StockOption[]>([]);
  readonly sales = signal<SaleResponse[]>([]);
  readonly lines = signal<LineItem[]>([]);
  readonly salesLoading = signal(true);
  readonly lineSaving = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  readonly posForm = new FormGroup({
    branch_id: new FormControl<number | null>(null, Validators.required),
    client_id: new FormControl<number | null>(null, Validators.required),
    stock_id: new FormControl<number | null>(null, Validators.required),
    quantity: new FormControl(1, [Validators.required, Validators.min(1)]),
    paid: new FormControl(true)
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.api.list<BranchResponse>('branches').subscribe({
      next: (v) => {
        this.branches.set(v.filter((b) => b.is_active));
        if (!this.posForm.controls.branch_id.value && v.length) {
          this.posForm.patchValue({ branch_id: v[0].id });
        }
      },
      error: () => this.branches.set([])
    });
    this.api.list<UserResponse>('users').subscribe({
      next: (v) => this.clients.set(v),
      error: () => this.clients.set([])
    });

    this.bindStock();

    this.salesLoading.set(true);
    this.commerce.listSales().subscribe({
      next: (v) => { this.sales.set(v); this.salesLoading.set(false); },
      error: () => this.salesLoading.set(false)
    });
  }

  private bindStock(): void {
    this.api.list<StockResponse>('inventory/stock').subscribe({
      next: (stocks) => {
        this.api.list<ProductResponse>('products').subscribe({
          next: (products) => {
            const variantMap = new Map<number, string>();
            products.forEach((p) =>
              p.variants.forEach((v) => variantMap.set(v.id, `${p.name} · ${v.codigo}`))
            );
            const branchMap = new Map<number, string>();
            this.branches().forEach((b) => branchMap.set(b.id, b.name));
            this.stockOptions.set(
              stocks.map((s) => ({
                stockId: s.id,
                label: `${variantMap.get(s.variant_id) ?? `Variante #${s.variant_id}`} — ${branchMap.get(s.branch_id) ?? `Sucursal #${s.branch_id}`}`,
                available: s.available_stock
              }))
            );
          },
          error: () => this.stockOptions.set([])
        });
      },
      error: () => this.stockOptions.set([])
    });
  }

  addLine(): void {
    const stockId = this.posForm.controls.stock_id.value;
    const quantity = this.posForm.controls.quantity.value || 1;
    if (!stockId) { return; }
    const option = this.stockOptions().find((s) => s.stockId === stockId);
    const existing = this.lines().find((l) => l.stockId === stockId);
    if (existing) {
      this.lines.update((lines) =>
        lines.map((l) => (l.stockId === stockId ? { ...l, quantity: l.quantity + quantity } : l))
      );
    } else {
      this.lines.update((lines) => [
        ...lines,
        { stockId, quantity, label: option?.label ?? `Stock #${stockId}` }
      ]);
    }
  }

  removeLine(index: number): void {
    this.lines.update((lines) => lines.filter((_, i) => i !== index));
  }

  submitPos(): void {
    const branchId = this.posForm.controls.branch_id.value;
    const clientId = this.posForm.controls.client_id.value;
    if (!branchId || !clientId || !this.lines().length) {
      this.error.set('Completa sucursal, cliente y al menos un artículo.');
      return;
    }
    this.lineSaving.set(true);
    this.error.set('');
    this.message.set('');
    this.commerce
      .createPosSale({
        branch_id: branchId,
        client_id: clientId,
        items: this.lines().map((l) => ({ stock_id: l.stockId, quantity: l.quantity })),
        paid: Boolean(this.posForm.controls.paid.value)
      })
      .subscribe({
        next: (sale) => {
          this.lineSaving.set(false);
          this.message.set(`Venta #${sale.id} registrada. Total: ${sale.total}`);
          this.lines.set([]);
          this.posForm.patchValue({ quantity: 1 });
          this.load();
        },
        error: (e: Error) => {
          this.lineSaving.set(false);
          this.error.set(e.message || 'No se pudo registrar la venta.');
        }
      });
  }

  clientName(id: number): string {
    return this.clients().find((c) => c.id === id)?.full_name ?? `#${id}`;
  }

  branchName(id: number): string {
    return this.branches().find((b) => b.id === id)?.name ?? `#${id}`;
  }
}