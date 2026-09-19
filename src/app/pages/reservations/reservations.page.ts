import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BranchesService } from '../../core/services/branches.service';
import { CommerceService } from '../../core/services/commerce.service';
import {
  BranchResponse,
  ReservationResponse,
  ReservationStatus
} from '../../models';

@Component({
  selector: 'app-reservations-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Gestión de reservas en tienda</h2>

    <div class="toolbar">
      <div class="field">
        <label for="status">Estado</label>
        <select id="status" [(ngModel)]="statusFilter">
          <option [ngValue]="null">Todos</option>
          @for (status of statuses; track status) {
            <option [ngValue]="status">{{ status }}</option>
          }
        </select>
      </div>
      <div class="field">
        <label for="branch">Sucursal</label>
        <select id="branch" [(ngModel)]="branchFilter">
          <option [ngValue]="null">Todas</option>
          @for (branch of branches(); track branch.id) {
            <option [ngValue]="branch.id">{{ branch.name }}</option>
          }
        </select>
      </div>
      <div class="field">
        <label for="date">Fecha</label>
        <input id="date" type="date" [(ngModel)]="dateFilter" />
      </div>
      <button class="btn-primary" (click)="load()">Filtrar</button>
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (message()) {
      <p class="success">{{ message() }}</p>
    }

    @if (!loading() && reservations().length === 0) {
      <p class="muted">No hay reservas para los filtros seleccionados.</p>
    }

    @for (reservation of reservations(); track reservation.id) {
      <div class="card">
        <div class="row">
          <strong>Reserva #{{ reservation.id }}</strong>
          <span class="badge">{{ reservation.status }}</span>
          <span class="spacer"></span>
          <span class="muted">
            Cliente #{{ reservation.client_id }} · Sucursal #{{ reservation.branch_id }} ·
            {{ reservation.reservation_date }} {{ reservation.reservation_time }}
          </span>
        </div>
        <p class="muted">Artículos: {{ reservation.items.length }}</p>
        <div class="row">
          <div class="field">
            <label for="rst_{{ reservation.id }}">Estado</label>
            <select
              [id]="'rst_' + reservation.id"
              [ngModel]="reservation.status"
              (ngModelChange)="update(reservation, $event, reservation.fitting_room)"
            >
              @for (status of statuses; track status) {
                <option [ngValue]="status">{{ status }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="room_{{ reservation.id }}">Probador</label>
            <input
              [id]="'room_' + reservation.id"
              type="number"
              min="1"
              [ngModel]="reservation.fitting_room"
              (ngModelChange)="setRoom(reservation, $event)"
            />
          </div>
        </div>
      </div>
    }
  `
})
export class ReservationsPage {
  private readonly commerce = inject(CommerceService);
  private readonly branchesService = inject(BranchesService);

  readonly branches = signal<BranchResponse[]>([]);
  readonly reservations = signal<ReservationResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly statuses = Object.values(ReservationStatus);

  statusFilter: ReservationStatus | null = null;
  branchFilter: number | null = null;
  dateFilter = '';

  constructor() {
    this.branchesService.list().subscribe((d) => this.branches.set(d));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.commerce
      .listReservations({
        status: this.statusFilter ?? undefined,
        branchId: this.branchFilter ?? undefined,
        date: this.dateFilter || undefined
      })
      .subscribe({
        next: (data) => {
          this.reservations.set(data);
          this.loading.set(false);
        },
        error: (err: Error) => {
          this.error.set(err.message);
          this.loading.set(false);
        }
      });
  }

  update(
    reservation: ReservationResponse,
    status: ReservationStatus,
    fittingRoom: number | null
  ): void {
    this.message.set(null);
    this.commerce
      .updateReservation(reservation.id, { status, fitting_room: fittingRoom ?? null })
      .subscribe({
        next: () => {
          this.message.set(`Reserva #${reservation.id} actualizada a "${status}".`);
          this.load();
        },
        error: (err: Error) => this.error.set(err.message)
      });
  }

  setRoom(reservation: ReservationResponse, room: number | null): void {
    this.commerce
      .updateReservation(reservation.id, { fitting_room: room ?? null })
      .subscribe({
        next: () => this.message.set(`Probador asignado a la reserva #${reservation.id}.`),
        error: (err: Error) => this.error.set(err.message)
      });
  }
}
