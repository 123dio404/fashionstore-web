import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ICONS } from '../../core/navigation';
import { CommerceService } from '../../core/services/commerce.service';
import { ReservationResponse, ReservationStatus } from '../../models';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { UiEmptyComponent } from '../../shared/ui/empty-state.component';
import { UiErrorComponent } from '../../shared/ui/error-state.component';
import { UiIconComponent } from '../../shared/ui/icon.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';

/** CU15 — Consultar y cancelar reservas (web): tarjetas con estado, probador y cancelación. */
@Component({
  selector: 'app-my-reservations-page',
  imports: [
    CommonModule,
    RouterLink,
    UiEmptyComponent,
    UiErrorComponent,
    UiIconComponent,
    UiSkeletonComponent
  ],
  templateUrl: './my-reservations.page.html',
  styleUrl: './my-reservations.page.scss'
})
export class MyReservationsPage {
  private readonly commerce = inject(CommerceService);
  private readonly confirm = inject(ConfirmService);

  readonly icons = ICONS;
  readonly reservations = signal<ReservationResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  constructor() {
    this.load();
  }

  canCancel(reservation: ReservationResponse): boolean {
    return (
      reservation.status !== ReservationStatus.Cancelada &&
      reservation.status !== ReservationStatus.Completada &&
      reservation.status !== ReservationStatus.Reembolsada &&
      reservation.status !== ReservationStatus.Devuelta
    );
  }

  /** Color del badge según el estado de la reserva (CU14 la avanza en tienda). */
  statusClass(reservation: ReservationResponse): string {
    switch (reservation.status) {
      case ReservationStatus.Completada:
        return 'ok';
      case ReservationStatus.Cancelada:
        return 'err';
      case ReservationStatus.Reembolsada:
      case ReservationStatus.Devuelta:
        return 'neutral';
      case ReservationStatus.EnProbador:
      case ReservationStatus.EnTienda:
      case ReservationStatus.Lista:
        return 'warn';
      default:
        return 'info';
    }
  }

  statusLabel(reservation: ReservationResponse): string {
    return reservation.status.replace(/_/g, ' ');
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
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
