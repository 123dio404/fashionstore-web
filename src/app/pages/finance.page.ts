import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ApiService } from '../core/services/api.service';
import { FinanceService } from '../core/services/finance.service';
import {
  FeeLedgerItem,
  FeeType,
  FinancialReportResponse,
  FineResponse,
  FineStatus,
  PaymentResponse,
  UserResponse
} from '../models';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="container page">
      <div class="page-head">
        <p class="eyebrow">Área financiera</p>
        <h1 class="page-title">Finanzas</h1>
        <p class="page-lead">Cuotas, pagos y multas de la organización.</p>
      </div>

      <div class="period-row">
        <label class="period-label" for="period">Periodo
          <input id="period" type="month" [value]="period()" (change)="onPeriod($event)" />
        </label>
        <button class="btn btn-ghost btn-sm" type="button" (click)="reload()">Actualizar</button>
      </div>

      @if (reportError()) {
        <div class="alert alert-error">{{ reportError() }}</div>
      }

      @if (report()) {
        @if (summary(); as s) {
          <div class="stat-grid">
            <div class="stat-card">
              <span class="stat-label">Emitido</span>
              <span class="stat-value">{{ s.total_amount | currency }}</span>
              <span class="stat-sub">{{ s.total_fees }} cuotas</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Recaudado</span>
              <span class="stat-value" style="color:var(--success)">{{ s.total_collected | currency }}</span>
              <span class="stat-sub">{{ s.collection_rate }}% de cobro</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Pendiente</span>
              <span class="stat-value" style="color:var(--warning)">{{ s.total_pending | currency }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Multas</span>
              <span class="stat-value" style="color:var(--danger)">{{ s.fine_total | currency }}</span>
            </div>
          </div>
        }
      }

      <div class="admin-grid mt-3">
        <section class="card">
          <div class="card-head">
            <h3>Registrar cuota</h3>
          </div>
          <form [formGroup]="feeForm" (ngSubmit)="createFee()">
            <div class="form-grid">
              <div class="form-field">
                <label>Tipo</label>
                <select formControlName="fee_type">
                  <option value="cuota">Cuota</option>
                  <option value="expensa">Expensa</option>
                </select>
              </div>
              <div class="form-field">
                <label>Periodo</label>
                <input type="month" formControlName="period" />
              </div>
              <div class="form-field full">
                <label>Concepto</label>
                <input type="text" formControlName="concept" placeholder="Ej. Cuota de mantenimiento" />
              </div>
              <div class="form-field">
                <label>Monto</label>
                <input type="number" formControlName="amount" min="0.01" step="0.01" />
              </div>
              <div class="form-field">
                <label>Vencimiento</label>
                <input type="datetime-local" formControlName="due_date" />
              </div>
              <div class="form-field full">
                <label>Descripción</label>
                <textarea formControlName="description"></textarea>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary btn-sm" type="submit" [disabled]="feeForm.invalid || feeSaving()">
                {{ feeSaving() ? 'Guardando…' : 'Crear cuota' }}
              </button>
            </div>
          </form>
        </section>

        <section class="card">
          <div class="card-head">
            <h3>Multas</h3>
          </div>
          <form [formGroup]="fineForm" (ngSubmit)="createFine()">
            <div class="form-grid">
              <div class="form-field">
                <label>Usuario</label>
                <select formControlName="user_id">
                  @for (u of users(); track u.id) {
                    <option [value]="u.id">{{ u.full_name }}</option>
                  }
                </select>
              </div>
              <div class="form-field">
                <label>Monto</label>
                <input type="number" formControlName="amount" min="0.01" step="0.01" />
              </div>
              <div class="form-field full">
                <label>Motivo</label>
                <input type="text" formControlName="reason" placeholder="Ej. Daño en instalaciones" />
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary btn-sm" type="submit" [disabled]="fineForm.invalid || fineSaving()">
                {{ fineSaving() ? 'Guardando…' : 'Imponer multa' }}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section class="card mt-3">
        <div class="card-head">
          <h3>Cuotas del periodo</h3>
          <span class="small muted-2">{{ fees().length }} registros</span>
        </div>
        @if (!feesLoading() && fees().length) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Recaudado</th>
                  <th>Pendiente</th>
                  <th>Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                @for (fee of fees(); track fee.id) {
                  <tr>
                    <td class="strong">{{ fee.concept }}</td>
                    <td><span class="badge badge-neutral">{{ fee.fee_type }}</span></td>
                    <td>{{ fee.amount | currency }}</td>
                    <td class="muted">{{ fee.collected | currency }}</td>
                    <td>
                      @if (fee.pending > 0) {
                        <span class="badge badge-warning">{{ fee.pending | currency }}</span>
                      } @else {
                        <span class="badge badge-success">Cubierto</span>
                      }
                    </td>
                    <td class="small muted-2">{{ fee.due_date ? (fee.due_date | date:'short') : '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        @if (!feesLoading() && !fees().length) {
          <div class="empty"><h3>Sin cuotas</h3><p>No hay cuotas para este periodo.</p></div>
        }
      </section>

      <section class="card mt-3">
        <div class="card-head">
          <h3>Multas emitidas</h3>
          <span class="small muted-2">{{ fines().length }} registros</span>
        </div>
        @if (fines().length) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Motivo</th>
                  <th>Usuario</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (fine of fines(); track fine.id) {
                  <tr>
                    <td class="strong">{{ fine.reason }}</td>
                    <td>{{ userName(fine.user_id) }}</td>
                    <td>{{ fine.amount | currency }}</td>
                    <td>
                      <span class="badge" [class]="fineBadge(fine.status)">{{ fine.status }}</span>
                    </td>
                    <td>
                      @if (fine.status === 'pendiente') {
                        <button class="btn btn-ghost btn-sm" type="button" (click)="markFinePaid(fine)">
                          Marcar pagada
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        @if (!fines().length) {
          <div class="empty"><h3>Sin multas</h3><p>No hay multas registradas.</p></div>
        }
      </section>

      <section class="card mt-3">
        <div class="card-head">
          <h3>Pagos realizados</h3>
          <span class="small muted-2">{{ payments().length }} registros</span>
        </div>
        @if (payments().length) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cuota</th>
                  <th>Usuario</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                @for (p of payments(); track p.id) {
                  <tr>
                    <td>#{{ p.fee_id }}</td>
                    <td>{{ userName(p.user_id) }}</td>
                    <td>{{ p.amount | currency }}</td>
                    <td class="muted">{{ p.method }}</td>
                    <td><span class="badge badge-success">{{ p.status }}</span></td>
                    <td class="small muted-2">{{ p.created_at | date:'short' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        @if (!payments().length) {
          <div class="empty"><h3>Sin pagos</h3><p>No hay pagos registrados todavía.</p></div>
        }
      </section>
    </div>
  `,
  styles: [`
    .period-row { display: flex; align-items: end; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
    .period-label { display: grid; gap: 6px; font-size: 0.8rem; font-weight: 700; }
    .admin-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 920px) {
      .admin-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class FinancePage {
  private finance = inject(FinanceService);
  private api = inject(ApiService);

  readonly period = signal(this.currentPeriod());
  readonly report = signal<FinancialReportResponse | null>(null);
  readonly fees = signal<FeeLedgerItem[]>([]);
  readonly feesLoading = signal(true);
  readonly fines = signal<FineResponse[]>([]);
  readonly payments = signal<PaymentResponse[]>([]);
  readonly users = signal<UserResponse[]>([]);
  readonly reportError = signal('');
  readonly feeSaving = signal(false);
  readonly fineSaving = signal(false);

  readonly feeForm = new FormGroup({
    fee_type: new FormControl<FeeType>(FeeType.Cuota, { nonNullable: true, validators: [Validators.required] }),
    period: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    concept: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    amount: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    due_date: new FormControl(''),
    description: new FormControl('')
  });

  readonly fineForm = new FormGroup({
    user_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] })
  });

  constructor() {
    this.feeForm.patchValue({ period: this.period() });
    this.api.list<UserResponse>('users').subscribe({
      next: (v) => this.users.set(v),
      error: () => this.users.set([])
    });
    this.reload();
  }

  onPeriod(event: Event): void {
    this.period.set((event.target as HTMLInputElement).value);
    this.reload();
  }

  reload(): void {
    const p = this.period();
    if (!p) { return; }
    this.reportError.set('');
    this.finance.report(p).subscribe({
      next: (r) => {
        this.report.set(r);
        this.fees.set(r.fees);
        this.feesLoading.set(false);
        this.fines.set(r.fines);
      },
      error: () => {
        this.reportError.set('No fue posible obtener el reporte financiero.');
        this.feesLoading.set(false);
      }
    });
    this.finance.listPayments().subscribe({
      next: (v) => this.payments.set(v),
      error: () => this.payments.set([])
    });
  }

  createFee(): void {
    if (this.feeForm.invalid) { return; }
    this.feeSaving.set(true);
    const raw = this.feeForm.getRawValue();
    this.finance
      .createFee({
        fee_type: raw.fee_type,
        period: raw.period,
        concept: raw.concept,
        amount: Number(raw.amount),
        due_date: raw.due_date || undefined,
        description: raw.description || undefined
      })
      .subscribe({
        next: () => {
          this.feeSaving.set(false);
          this.reload();
        },
        error: () => {
          this.feeSaving.set(false);
          this.reportError.set('No se pudo crear la cuota.');
        }
      });
  }

  createFine(): void {
    if (this.fineForm.invalid) { return; }
    this.fineSaving.set(true);
    const raw = this.fineForm.getRawValue();
    this.finance
      .createFine({
        user_id: Number(raw.user_id),
        reason: raw.reason,
        amount: Number(raw.amount)
      })
      .subscribe({
        next: () => {
          this.fineSaving.set(false);
          this.reload();
        },
        error: () => {
          this.fineSaving.set(false);
          this.reportError.set('No se pudo imponer la multa.');
        }
      });
  }

  markFinePaid(fine: FineResponse): void {
    this.finance.updateFine(fine.id, { status: FineStatus.Pagada }).subscribe({
      next: () => this.reload(),
      error: () => this.reportError.set('No se pudo actualizar la multa.')
    });
  }

  userName(id: number): string {
    return this.users().find((u) => u.id === id)?.full_name ?? `#${id}`;
  }

  fineBadge(status: FineStatus): string {
    switch (status) {
      case 'pagada': return 'badge-success';
      case 'pendiente': return 'badge-warning';
      default: return 'badge-neutral';
    }
  }

  summary() {
    return this.report()?.summary ?? null;
  }

  private currentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}