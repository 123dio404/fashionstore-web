import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { CommerceService } from '../../core/services/commerce.service';
import { ReservationResponse, ReservationStatus } from '../../models';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { UiEmptyComponent } from '../../shared/ui/empty-state.component';
import { UiErrorComponent } from '../../shared/ui/error-state.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';

@Component({
  selector: 'app-my-reservations-page',
  imports: [CommonModule, UiEmptyComponent, UiErrorComponent, UiSkeletonComponent],
  template: `
    <h2>Mis reservas</h2>
    <p class="muted">
      Consulta el estado de tus reservas para probador físico y cancélalas para liberar stock.
    </p>

    @if (message()) {
      <p class="success">{{ message() }}</p>
    }

    @if (loading()) {
      <app-ui-skeleton [rows]="3" [height]="64" />
    } @else if (error()) {
      <app-ui-error [message]="error() ?? ''" (retry)="load()" />
    } @else if (reservations().length === 0) {
      <app-ui-empty
        icon="📅"
        title="Sin reservas"
        message="No tienes reservas registradas. Puedes crear una desde la app móvil."
      />
    }

    @for (reservation of reservations(); track reservation.id) {
      <div class="card">
        <div class="row">
          <strong>Reserva #{{ reservation.id }}</strong>
          <span class="badge" [class.ok]="reservation.status === 'confirmada'">
            {{ reservation.status }}
          </span>
          <span class="spacer"></span>
          <span class="muted">
            {{ reservation.reservation_date }} · {{ reservation.reservation_time }}
          </span>
        </div>
        <p class="muted">Sucursal #{{ reservation.branch_id }} · {{ reservation.items.length }} artículo(s)</p>
        @if (canCancel(reservation)) {
          <button class="btn-danger" (click)="cancel(reservation)">Cancelar reserva</button>
        }
      </div>
    }
  `
})
export class MyReservationsPage {
  private readonly commerce = inject(CommerceService);
  private readonly confirm = inject(ConfirmService);

  readonly reservations = signal<ReservationResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  constructor() {
    this.load();
  }

  canCancel(reservation: ReservationResponse): boolean {
    return reservation.status !== ReservationStatus.Cancelada &&
      reservation.status !== ReservationStatus.Completada;
  }

  load(): void {
    this.loading.set(true);
    this.commerce.listReservations().subscribe({
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

  cancel(reservation: ReservationResponse): void {
    void this.confirm
      .ask({
        title: 'Cancelar reserva',
        message: `¿Seguro que quieres cancelar la reserva #${reservation.id}? Se liberará el stock reservado.`,
        confirmLabel: 'Sí, cancelar',
        danger: true
      })
      .then((confirmed) => {
        if (!confirmed) return;
        this.message.set(null);
        this.commerce
          .updateReservation(reservation.id, { status: ReservationStatus.Cancelada })
          .subscribe({
            next: () => {
              this.message.set(`Reserva #${reservation.id} cancelada.`);
              this.load();
            },
            error: (err: Error) => this.error.set(err.message)
          });
      });
  }
}
