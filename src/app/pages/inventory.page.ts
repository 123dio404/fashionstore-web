import { DatePipe } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../core/services/api.service';
import {
  BranchResponse,
  MovementResponse,
  ProductResponse,
  StockResponse
} from '../models';

interface StockView extends StockResponse {
  productName: string;
  variantLabel: string;
  branchName: string;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <div class="container page">
      <div class="page-head">
        <p class="eyebrow">Operaciones</p>
        <h1 class="page-title">Inventario</h1>
        <p class="page-lead">Controla el stock, realiza ajustes y gestiona transferencias entre sucursales.</p>
      </div>

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }
      @if (message()) {
        <div class="alert alert-success">{{ message() }}</div>
      }

      <div class="admin-grid">
        <div class="card-stack">
          <section class="card">
            <h3>Ajustar stock</h3>
            <form [formGroup]="adjustForm" (ngSubmit)="adjust()">
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
                  <label>Variante</label>
                  <select formControlName="variant_id">
                    @for (v of variantOptions(); track v.id) {
                      <option [value]="v.id">{{ v.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-field">
                  <label>Cantidad</label>
                  <input type="number" formControlName="quantity" placeholder="±n" />
                </div>
                <div class="form-field">
                  <label>Motivo</label>
                  <input type="text" formControlName="reason" placeholder="Opcional" />
                </div>
              </div>
              <button class="btn btn-primary btn-sm" type="submit" [disabled]="adjustForm.invalid || saving()">
                {{ saving() ? 'Guardando…' : 'Registrar ajuste' }}
              </button>
            </form>
          </section>

          <section class="card">
            <h3>Transferir entre sucursales</h3>
            <form [formGroup]="transferForm" (ngSubmit)="transfer()">
              <div class="form-grid">
                <div class="form-field">
                  <label>Variante</label>
                  <select formControlName="variant_id">
                    @for (v of variantOptions(); track v.id) {
                      <option [value]="v.id">{{ v.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-field">
                  <label>Sucursal origen</label>
                  <select formControlName="source_branch_id">
                    @for (b of branches(); track b.id) {
                      <option [value]="b.id">{{ b.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-field">
                  <label>Sucursal destino</label>
                  <select formControlName="destination_branch_id">
                    @for (b of branches(); track b.id) {
                      <option [value]="b.id">{{ b.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-field">
                  <label>Cantidad</label>
                  <input type="number" formControlName="quantity" min="1" />
                </div>
                <div class="form-field">
                  <label>Motivo</label>
                  <input type="text" formControlName="reason" placeholder="Opcional" />
                </div>
              </div>
              <button class="btn btn-primary btn-sm" type="submit" [disabled]="transferForm.invalid || saving()">
                {{ saving() ? 'Guardando…' : 'Registrar transferencia' }}
              </button>
            </form>
          </section>
        </div>

        <section class="card">
          <div class="card-head">
            <h3>Stock actual</h3>
            <button class="btn btn-ghost btn-sm" type="button" (click)="load()">Actualizar</button>
          </div>
          @if (loading()) {
            <div class="loading-row"><span class="spinner"></span> Cargando…</div>
          }
          @if (!loading() && stockView().length) {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sucursal</th>
                    <th>Producto</th>
                    <th>Físico</th>
                    <th>Reservado</th>
                    <th>Disponible</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of stockView(); track s.id) {
                    <tr>
                      <td class="small strong">{{ s.branchName }}</td>
                      <td class="truncate" style="max-width:220px" [title]="s.variantLabel">{{ s.variantLabel }}</td>
                      <td class="strong">{{ s.physical_stock }}</td>
                      <td class="muted">{{ s.reserved_stock }}</td>
                      <td>
                        @if (s.available_stock > 0) {
                          <span class="badge badge-success">{{ s.available_stock }}</span>
                        } @else {
                          <span class="badge badge-danger">0</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @if (!loading() && !stockView().length) {
            <div class="empty">
              <h3>Sin existencias</h3>
              <p>No hay registros de stock para mostrar.</p>
            </div>
          }
        </section>
      </div>

      <section class="card mt-3">
        <div class="card-head">
          <h3>Movimientos recientes</h3>
          <button class="btn btn-ghost btn-sm" type="button" (click)="load()">Actualizar</button>
        </div>
        @if (!movements().length) {
          <div class="empty"><h3>Sin movimientos</h3></div>
        }
        @if (movements().length) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Variante</th>
                  <th>Cantidad</th>
                  <th>Motivo</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                @for (m of movements(); track m.id) {
                  <tr>
                    <td><span class="badge badge-accent">{{ m.movement_type }}</span></td>
                    <td>{{ m.variant_id }}</td>
                    <td class="strong">{{ m.quantity }}</td>
                    <td class="small muted-2">{{ m.reason || '—' }}</td>
                    <td class="small muted-2">{{ m.created_at | date:'short' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .admin-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
      gap: 20px;
      align-items: start;
    }
    .card-stack { display: grid; gap: 18px; }
    @media (max-width: 920px) {
      .admin-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class InventoryPage {
  private readonly api = inject(ApiService);

  readonly branches = signal<BranchResponse[]>([]);
  readonly stockView = signal<StockView[]>([]);
  readonly movements = signal<MovementResponse[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  readonly variantOptions = computed(() => {
    return this.variantLookup().map((v) => ({
      id: v.variantId,
      label: `${v.productName} · ${v.sizeName} ${v.colorName} (${v.codigo})`
    }));
  });

  private readonly variantLookup = signal<Array<{
    variantId: number;
    productName: string;
    sizeName: string;
    colorName: string;
    codigo: string;
  }>>([]);

  readonly adjustForm = new FormGroup({
    branch_id: new FormControl<number | null>(null, Validators.required),
    variant_id: new FormControl<number | null>(null, Validators.required),
    quantity: new FormControl(0, [Validators.required]),
    reason: new FormControl('')
  });

  readonly transferForm = new FormGroup({
    variant_id: new FormControl<number | null>(null, Validators.required),
    source_branch_id: new FormControl<number | null>(null, Validators.required),
    destination_branch_id: new FormControl<number | null>(null, Validators.required),
    quantity: new FormControl(1, [Validators.required, Validators.min(1)]),
    reason: new FormControl('')
  });

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.message.set('');

    this.api.list<BranchResponse>('branches').subscribe({
      next: (v) => {
        this.branches.set(v);
        if (v.length) {
          this.adjustForm.patchValue({ branch_id: v[0].id });
          this.transferForm.patchValue({ source_branch_id: v[0].id, destination_branch_id: v.length > 1 ? v[1].id : v[0].id });
        }
      }
    });

    const [products, stocks] = await Promise.all([
      firstValueFrom(this.api.list<ProductResponse>('products')),
      firstValueFrom(this.api.list<StockResponse>('inventory/stock'))
    ]);
    const variantLabelMap = new Map<number, string>();
    const variantLookup: Array<{ variantId: number; productName: string; sizeId: number; colorId: number; sizeName: string; colorName: string; codigo: string }> = [];
    (products ?? []).forEach((p) => {
      p.variants.forEach((v) => {
        variantLabelMap.set(v.id, `${p.name} · ${v.codigo}`);
        variantLookup.push({
          variantId: v.id,
          productName: p.name,
          sizeId: v.size_id ?? 0,
          colorId: v.color_id ?? 0,
          sizeName: `T${v.size_id ?? '?'}`,
          colorName: `C${v.color_id ?? '?'}`,
          codigo: v.codigo
        });
      });
    });

    const [sizes, colors] = await Promise.all([
      firstValueFrom(this.api.list<{ id: number; name: string }>('parameters/sizes')),
      firstValueFrom(this.api.list<{ id: number; name: string }>('parameters/colors'))
    ]);
    const sizeMap = new Map<number, string>();
    const colorMap = new Map<number, string>();
    (sizes ?? []).forEach((s) => sizeMap.set(s.id, s.name));
    (colors ?? []).forEach((c) => colorMap.set(c.id, c.name));
    variantLookup.forEach((vl) => {
      vl.sizeName = sizeMap.get(vl.sizeId) ?? `T${vl.sizeId}`;
      vl.colorName = colorMap.get(vl.colorId) ?? `C${vl.colorId}`;
    });
    const branchMap = new Map<number, string>();
    this.branches().forEach((b) => branchMap.set(b.id, b.name));

    const view: StockView[] = (stocks ?? []).map((s) => ({
      ...s,
      productName: variantLookup.find((vl) => vl.variantId === s.variant_id)?.productName ?? '—',
      variantLabel: variantLabelMap.get(s.variant_id) ?? `Variante #${s.variant_id}`,
      branchName: branchMap.get(s.branch_id) ?? `Sucursal #${s.branch_id}`
    }));

    this.stockView.set(view);
    this.variantLookup.set(variantLookup);
    this.loading.set(false);

    this.api.list<MovementResponse>('inventory/movements').subscribe({
      next: (v) => this.movements.set(v.slice(0, 15)),
      error: () => {}
    });
  }

  adjust(): void {
    if (this.adjustForm.invalid) { return; }
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    this.api.create('inventory/movements/adjustment', this.adjustForm.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set('Ajuste registrado correctamente.');
        this.load();
      },
      error: (e: Error) => {
        this.saving.set(false);
        this.error.set(e.message || 'No se pudo registrar el ajuste.');
      }
    });
  }

  transfer(): void {
    if (this.transferForm.invalid) { return; }
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    this.api.create('inventory/transfers', this.transferForm.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set('Transferencia registrada correctamente.');
        this.load();
      },
      error: (e: Error) => {
        this.saving.set(false);
        this.error.set(e.message || 'No se pudo registrar la transferencia.');
      }
    });
  }
}