import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ICONS } from '../../core/navigation';
import { BranchesService } from '../../core/services/branches.service';
import { CommerceService } from '../../core/services/commerce.service';
import { BranchResponse, ReservationResponse, ReservationStatus } from '../../models';
import { UiDrawerComponent } from '../../shared/ui/drawer.component';
import { UiEmptyComponent } from '../../shared/ui/empty-state.component';
import { UiIconComponent } from '../../shared/ui/icon.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';
import { TabItem, UiTabsComponent } from '../../shared/ui/tabs.component';

interface NextStep {
  status: ReservationStatus;
  label: string;
}

/** Agrupación de estados en pestañas (equivale al tablero por estados del prototipo). */
const TAB_GROUPS: Array<{ id: string; label: string; statuses: ReservationStatus[] | null }> = [
  { id: 'todas', label: 'Todas', statuses: null },
  {
    id: 'nuevas',
    label: 'Por confirmar',
    statuses: [ReservationStatus.Pendiente, ReservationStatus.Confirmada]
  },
  {
    id: 'preparacion',
    label: 'En preparación',
    statuses: [ReservationStatus.Preparacion, ReservationStatus.Lista]
  },
  {
    id: 'probador',
    label: 'En probador',
    statuses: [
      ReservationStatus.Asignada,
      ReservationStatus.EnProbador,
      ReservationStatus.EnTienda,
      ReservationStatus.Checkout
    ]
  },
  {
    id: 'cerradas',
    label: 'Cerradas',
    statuses: [
      ReservationStatus.Completada,
      ReservationStatus.Cancelada,
      ReservationStatus.Reembolsada,
      ReservationStatus.Devuelta
    ]
  }
];

/** CU14 — Atender y gestionar reservas en tienda: tablero por estados, probador y avance del flujo. */
@Component({
  selector: 'app-reservations-page',
  imports: [
    CommonModule,
    FormsModule,
    UiDrawerComponent,
    UiEmptyComponent,
    UiIconComponent,
    UiSkeletonComponent,
    UiTabsComponent
  ],
  templateUrl: './reservations.page.html',
  styleUrl: './reservations.page.scss'
})
export class ReservationsPage {
  private readonly commerce = inject(CommerceService);
  private readonly branchesService = inject(BranchesService);

  readonly icons = ICONS;
  readonly rooms = [1, 2, 3, 4, 5, 6];
  readonly branches = signal<BranchResponse[]>([]);
  readonly reservations = signal<ReservationResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly activeTab = signal('todas');
  readonly drawerOpen = signal(false);
  readonly drawerReservation = signal<ReservationResponse | null>(null);

  branchFilter: number | null = null;
  dateFilter = '';
  roomNumber: number | null = null;

  readonly tabs = computed<TabItem[]>(() =>
    TAB_GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
      count: this.countByGroup(group.id)
    }))
  );

  readonly visible = computed(() => {
    const group = TAB_GROUPS.find((item) => item.id === this.activeTab());
    if (!group || group.statuses === null) return this.reservations();
    const statuses = group.statuses;
    return this.reservations().filter((reservation) => statuses.includes(reservation.status));
  });

  constructor() {
    this.branchesService.list().subscribe({
      next: (items) => this.branches.set(items),
      error: (err: Error) => this.error.set(err.message)
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.commerce
      .listReservations({
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

  clearFilters(): void {
    this.branchFilter = null;
    this.dateFilter = '';
    this.load();
  }

  /** Siguiente paso real del flujo de atención de la reserva. */
  nextSteps(reservation: ReservationResponse): NextStep[] {
    switch (reservation.status) {
      case ReservationStatus.Pendiente:
        return [{ status: ReservationStatus.Confirmada, label: 'Confirmar' }];
      case ReservationStatus.Confirmada:
        return [{ status: ReservationStatus.Preparacion, label: 'Preparar prendas' }];
      case ReservationStatus.Preparacion:
        return [{ status: ReservationStatus.Lista, label: 'Marcar lista' }];
      case ReservationStatus.Lista:
        return [{ status: ReservationStatus.EnProbador, label: 'En probador' }];
      case ReservationStatus.Asignada:
      case ReservationStatus.EnProbador:
      case ReservationStatus.EnTienda:
      case ReservationStatus.Checkout:
        return [{ status: ReservationStatus.Completada, label: 'Marcar atendida' }];
      default:
        return [];
    }
  }

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

  advance(reservation: ReservationResponse, status: ReservationStatus): void {
    this.message.set(null);
    this.commerce
      .updateReservation(reservation.id, {
        status,
        fitting_room: reservation.fitting_room ?? null
      })
      .subscribe({
        next: () => {
          this.message.set(`Reserva #${reservation.id}: ${status.replace(/_/g, ' ')}.`);
          this.load();
        },
        error: (err: Error) => this.error.set(err.message)
      });
  }

  openRoomDrawer(reservation: ReservationResponse): void {
    this.drawerReservation.set(reservation);
    this.roomNumber = reservation.fitting_room ?? null;
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.drawerReservation.set(null);
  }

  saveRoom(): void {
    const reservation = this.drawerReservation();
    if (!reservation || !this.roomNumber) return;

    const status =
      reservation.status === ReservationStatus.Lista ||
      reservation.status === ReservationStatus.Preparacion
        ? ReservationStatus.Asignada
        : reservation.status;

    this.commerce
      .updateReservation(reservation.id, { fitting_room: this.roomNumber, status })
      .subscribe({
        next: () => {
          this.message.set(`Probador ${this.roomNumber} asignado a la reserva #${reservation.id}.`);
          this.closeDrawer();
          this.load();
        },
        error: (err: Error) => this.error.set(err.message)
      });
  }

  private countByGroup(groupId: string): number {
    const group = TAB_GROUPS.find((item) => item.id === groupId);
    if (!group || group.statuses === null) return this.reservations().length;
    const statuses = group.statuses;
    return this.reservations().filter((reservation) => statuses.includes(reservation.status)).length;
  }
}
