import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinanceService } from '../../core/services/finance.service';
import { UsersService } from '../../core/services/users.service';
import {
  FeeCreate,
  FeeResponse,
  FeeType,
  FineCreate,
  FineResponse,
  FineStatus,
  FinancialReportResponse,
  PaymentCreate,
  PaymentMethod,
  PaymentResponse,
  UserResponse
} from '../../models';

@Component({
  selector: 'app-finance-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Finanzas</h2>
    <p class="muted">Cuotas, pagos, multas y reporte financiero de la organización.</p>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (message()) {
      <p class="success">{{ message() }}</p>
    }

    <div class="card">
      <h3>Nueva cuota / expensa</h3>
      <div class="grid-2">
        <div>
          <label for="feeType">Tipo</label>
          <select id="feeType" [(ngModel)]="feeForm.fee_type">
            @for (type of feeTypes; track type) {
              <option [ngValue]="type">{{ type }}</option>
            }
          </select>
        </div>
        <div>
          <label for="feePeriod">Periodo</label>
          <input id="feePeriod" type="month" [(ngModel)]="feeForm.period" />
        </div>
        <div>
          <label for="feeConcept">Concepto</label>
          <input id="feeConcept" [(ngModel)]="feeForm.concept" />
        </div>
        <div>
          <label for="feeAmount">Monto</label>
          <input id="feeAmount" type="number" min="0" [(ngModel)]="feeForm.amount" />
        </div>
        <div>
          <label for="feeDue">Vencimiento</label>
          <input id="feeDue" type="date" [(ngModel)]="feeForm.due_date" />
        </div>
      </div>
      <br />
      <button class="btn-primary" (click)="createFee()">Crear cuota</button>
    </div>

    <div class="card">
      <h3>Cuotas</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tipo</th>
            <th>Periodo</th>
            <th>Concepto</th>
            <th>Monto</th>
            <th>Vence</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (fee of fees(); track fee.id) {
            <tr>
              <td>{{ fee.id }}</td>
              <td><span class="badge">{{ fee.fee_type }}</span></td>
              <td>{{ fee.period }}</td>
              <td>{{ fee.concept }}</td>
              <td>{{ fee.amount | currency: 'USD' }}</td>
              <td>{{ fee.due_date || '-' }}</td>
              <td><button class="btn-danger" (click)="removeFee(fee)">Eliminar</button></td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>Registrar pago</h3>
      <div class="grid-2">
        <div>
          <label for="payFee">Cuota</label>
          <select id="payFee" [(ngModel)]="paymentForm.fee_id">
            <option [ngValue]="0">Selecciona</option>
            @for (fee of fees(); track fee.id) {
              <option [ngValue]="fee.id">
                #{{ fee.id }} · {{ fee.concept }} ({{ fee.amount | currency: 'USD' }})
              </option>
            }
          </select>
        </div>
        <div>
          <label for="payAmount">Monto</label>
          <input id="payAmount" type="number" min="0" [(ngModel)]="paymentForm.amount" />
        </div>
        <div>
          <label for="payMethod">Método</label>
          <select id="payMethod" [(ngModel)]="paymentForm.method">
            @for (method of paymentMethods; track method) {
              <option [ngValue]="method">{{ method }}</option>
            }
          </select>
        </div>
      </div>
      <br />
      <button class="btn-primary" (click)="createPayment()">Registrar pago</button>
    </div>

    <div class="card">
      <h3>Pagos</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cuota</th>
            <th>Usuario</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          @for (payment of payments(); track payment.id) {
            <tr>
              <td>{{ payment.id }}</td>
              <td>{{ payment.fee_id }}</td>
              <td>{{ payment.user_id }}</td>
              <td>{{ payment.amount | currency: 'USD' }}</td>
              <td>{{ payment.method }}</td>
              <td><span class="badge ok">{{ payment.status }}</span></td>
              <td>{{ payment.created_at | date: 'short' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>Nueva multa</h3>
      <div class="grid-2">
        <div>
          <label for="fineUser">Usuario</label>
          <select id="fineUser" [(ngModel)]="fineForm.user_id">
            <option [ngValue]="0">Selecciona</option>
            @for (user of users(); track user.id) {
              <option [ngValue]="user.id">{{ user.full_name }} ({{ user.email }})</option>
            }
          </select>
        </div>
        <div>
          <label for="fineReason">Motivo</label>
          <input id="fineReason" [(ngModel)]="fineForm.reason" />
        </div>
        <div>
          <label for="fineAmount">Monto</label>
          <input id="fineAmount" type="number" min="0" [(ngModel)]="fineForm.amount" />
        </div>
      </div>
      <br />
      <button class="btn-primary" (click)="createFine()">Crear multa</button>
    </div>

    <div class="card">
      <h3>Multas</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Motivo</th>
            <th>Monto</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (fine of fines(); track fine.id) {
            <tr>
              <td>{{ fine.id }}</td>
              <td>{{ fine.user_id }}</td>
              <td>{{ fine.reason }}</td>
              <td>{{ fine.amount | currency: 'USD' }}</td>
              <td><span class="badge">{{ fine.status }}</span></td>
              <td>
                @if (fine.status === pendiente) {
                  <button class="btn" (click)="setFineStatus(fine, pagada)">Marcar pagada</button>
                  <button class="btn-danger" (click)="setFineStatus(fine, anulada)">Anular</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>Reporte financiero</h3>
      <div class="toolbar">
        <div class="field">
          <label for="period">Periodo</label>
          <input id="period" type="month" [(ngModel)]="period" />
        </div>
        <button class="btn-primary" (click)="generateReport()">Generar</button>
      </div>

      @if (report(); as data) {
        <div class="grid-2" style="margin-bottom: 1rem">
          <div class="stat">
            <div class="value">{{ data.summary.total_amount | currency: 'USD' }}</div>
            <div class="label">Total facturado</div>
          </div>
          <div class="stat">
            <div class="value">{{ data.summary.total_collected | currency: 'USD' }}</div>
            <div class="label">Recaudado</div>
          </div>
          <div class="stat">
            <div class="value">{{ data.summary.total_pending | currency: 'USD' }}</div>
            <div class="label">Pendiente</div>
          </div>
          <div class="stat">
            <div class="value">{{ data.summary.collection_rate }}%</div>
            <div class="label">Tasa de cobro</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Periodo</th>
              <th>Monto</th>
              <th>Cobrado</th>
              <th>Pendiente</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data.fees; track item.id) {
              <tr>
                <td>{{ item.concept }}</td>
                <td>{{ item.period }}</td>
                <td>{{ item.amount | currency: 'USD' }}</td>
                <td>{{ item.collected | currency: 'USD' }}</td>
                <td>{{ item.pending | currency: 'USD' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class FinancePage {
  private readonly finance = inject(FinanceService);
  private readonly usersService = inject(UsersService);

  readonly fees = signal<FeeResponse[]>([]);
  readonly payments = signal<PaymentResponse[]>([]);
  readonly fines = signal<FineResponse[]>([]);
  readonly users = signal<UserResponse[]>([]);
  readonly report = signal<FinancialReportResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  readonly feeTypes = Object.values(FeeType);
  readonly paymentMethods = Object.values(PaymentMethod);
  readonly pendiente = FineStatus.Pendiente;
  readonly pagada = FineStatus.Pagada;
  readonly anulada = FineStatus.Anulada;

  period = this.currentPeriod();
  feeForm: FeeCreate = {
    fee_type: FeeType.Cuota,
    period: this.currentPeriod(),
    concept: '',
    amount: 0,
    due_date: ''
  };
  paymentForm: PaymentCreate = { fee_id: 0, amount: 0, method: PaymentMethod.Efectivo };
  fineForm: FineCreate = { user_id: 0, reason: '', amount: 0 };

  constructor() {
    this.load();
    this.usersService.list().subscribe((data) => this.users.set(data));
  }

  private currentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private fail(err: Error): void {
    this.error.set(err.message);
    this.message.set(null);
  }

  load(): void {
    this.finance.listFees().subscribe({
      next: (d) => this.fees.set(d),
      error: (e: Error) => this.fail(e)
    });
    this.finance.listPayments().subscribe({
      next: (d) => this.payments.set(d),
      error: (e: Error) => this.fail(e)
    });
    this.finance.listFines().subscribe({
      next: (d) => this.fines.set(d),
      error: (e: Error) => this.fail(e)
    });
  }

  createFee(): void {
    if (!this.feeForm.concept.trim() || this.feeForm.amount <= 0) {
      this.fail(new Error('Concepto y monto mayor a 0 son obligatorios.'));
      return;
    }
    const payload: FeeCreate = { ...this.feeForm, due_date: this.feeForm.due_date || undefined };
    this.finance.createFee(payload).subscribe({
      next: () => {
        this.message.set('Cuota creada.');
        this.error.set(null);
        this.feeForm = {
          fee_type: FeeType.Cuota,
          period: this.currentPeriod(),
          concept: '',
          amount: 0,
          due_date: ''
        };
        this.load();
      },
      error: (e: Error) => this.fail(e)
    });
  }

  removeFee(fee: FeeResponse): void {
    this.finance.deleteFee(fee.id).subscribe({
      next: () => this.load(),
      error: (e: Error) => this.fail(e)
    });
  }

  createPayment(): void {
    if (!this.paymentForm.fee_id || this.paymentForm.amount <= 0) {
      this.fail(new Error('Selecciona una cuota y un monto válido.'));
      return;
    }
    this.finance.createPayment(this.paymentForm).subscribe({
      next: () => {
        this.message.set('Pago registrado.');
        this.error.set(null);
        this.paymentForm = { fee_id: 0, amount: 0, method: PaymentMethod.Efectivo };
        this.load();
      },
      error: (e: Error) => this.fail(e)
    });
  }

  createFine(): void {
    if (!this.fineForm.user_id || !this.fineForm.reason.trim() || this.fineForm.amount <= 0) {
      this.fail(new Error('Usuario, motivo y monto son obligatorios.'));
      return;
    }
    this.finance.createFine(this.fineForm).subscribe({
      next: () => {
        this.message.set('Multa creada.');
        this.error.set(null);
        this.fineForm = { user_id: 0, reason: '', amount: 0 };
        this.load();
      },
      error: (e: Error) => this.fail(e)
    });
  }

  setFineStatus(fine: FineResponse, status: FineStatus): void {
    this.finance.updateFine(fine.id, { status }).subscribe({
      next: () => {
        this.message.set(`Multa #${fine.id} actualizada a "${status}".`);
        this.load();
      },
      error: (e: Error) => this.fail(e)
    });
  }

  generateReport(): void {
    if (!this.period) return;
    this.finance.report(this.period).subscribe({
      next: (data) => this.report.set(data),
      error: (e: Error) => this.fail(e)
    });
  }
}
