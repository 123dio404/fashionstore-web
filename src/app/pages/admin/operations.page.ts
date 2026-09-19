import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { OperationsService } from '../../core/services/operations.service';
import {
  FacilityAvailabilityResponse,
  FacilityCreate,
  FacilityReservationResponse,
  FacilityResponse,
  FacilityUsageResponse,
  MaintenanceCreate,
  MaintenanceResponse,
  Priority,
  TaskStatus
} from '../../models';

@Component({
  selector: 'app-operations-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Operaciones</h2>
    <p class="muted">Instalaciones, mantenimiento, disponibilidad y uso de espacios.</p>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (message()) {
      <p class="success">{{ message() }}</p>
    }

    <div class="card">
      <h3>Nueva instalación</h3>
      <div class="grid-2">
        <div>
          <label for="fname">Nombre</label>
          <input id="fname" [(ngModel)]="facilityForm.name" />
        </div>
        <div>
          <label for="flocation">Ubicación</label>
          <input id="flocation" [(ngModel)]="facilityForm.location" />
        </div>
        <div>
          <label for="fcapacity">Capacidad</label>
          <input id="fcapacity" type="number" min="1" [(ngModel)]="facilityForm.capacity" />
        </div>
        <div>
          <label for="fopen">Apertura</label>
          <input id="fopen" type="time" [(ngModel)]="facilityForm.open_time" />
        </div>
        <div>
          <label for="fclose">Cierre</label>
          <input id="fclose" type="time" [(ngModel)]="facilityForm.close_time" />
        </div>
      </div>
      <br />
      <button class="btn-primary" (click)="createFacility()">Crear instalación</button>
    </div>

    <div class="card">
      <h3>Instalaciones</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Ubicación</th>
            <th>Capacidad</th>
            <th>Horario</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (facility of facilities(); track facility.id) {
            <tr>
              <td>{{ facility.id }}</td>
              <td>{{ facility.name }}</td>
              <td>{{ facility.location || '-' }}</td>
              <td>{{ facility.capacity }}</td>
              <td>{{ facility.open_time || '-' }} – {{ facility.close_time || '-' }}</td>
              <td>
                <span class="badge" [class.ok]="facility.is_active">
                  {{ facility.is_active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td>
                <button class="btn" (click)="toggleFacility(facility)">
                  {{ facility.is_active ? 'Desactivar' : 'Activar' }}
                </button>
                <button class="btn-danger" (click)="removeFacility(facility)">Eliminar</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>Nueva tarea de mantenimiento</h3>
      <div class="grid-2">
        <div>
          <label for="tTitle">Título</label>
          <input id="tTitle" [(ngModel)]="taskForm.title" />
        </div>
        <div>
          <label for="tFacility">Instalación</label>
          <select id="tFacility" [(ngModel)]="taskForm.facility_id">
            <option [ngValue]="undefined">Sin instalación</option>
            @for (facility of facilities(); track facility.id) {
              <option [ngValue]="facility.id">{{ facility.name }}</option>
            }
          </select>
        </div>
        <div>
          <label for="tPriority">Prioridad</label>
          <select id="tPriority" [(ngModel)]="taskForm.priority">
            @for (priority of priorities; track priority) {
              <option [ngValue]="priority">{{ priority }}</option>
            }
          </select>
        </div>
        <div>
          <label for="tDate">Fecha programada</label>
          <input id="tDate" type="date" [(ngModel)]="taskForm.scheduled_date" />
        </div>
      </div>
      <br />
      <button class="btn-primary" (click)="createTask()">Crear tarea</button>
    </div>

    <div class="card">
      <h3>Tareas de mantenimiento</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Instalación</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Programada</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (task of tasks(); track task.id) {
            <tr>
              <td>{{ task.id }}</td>
              <td>{{ task.title }}</td>
              <td>{{ facilityName(task.facility_id) }}</td>
              <td><span class="badge">{{ task.priority }}</span></td>
              <td><span class="badge">{{ task.status }}</span></td>
              <td>{{ task.scheduled_date || '-' }}</td>
              <td>
                @for (status of taskStatuses; track status) {
                  @if (status !== task.status) {
                    <button class="btn" (click)="setTaskStatus(task, status)">{{ status }}</button>
                  }
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>Disponibilidad de instalación</h3>
      <div class="toolbar">
        <div class="field">
          <label for="aFacility">Instalación</label>
          <select id="aFacility" [(ngModel)]="availFacilityId">
            <option [ngValue]="0">Selecciona</option>
            @for (facility of facilities(); track facility.id) {
              <option [ngValue]="facility.id">{{ facility.name }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="aDate">Fecha</label>
          <input id="aDate" type="date" [(ngModel)]="availDate" />
        </div>
        <button class="btn-primary" (click)="checkAvailability()">Consultar</button>
      </div>
      @if (availability(); as data) {
        <p class="muted">
          {{ data.facility_name }} · Reservados: {{ data.booked }} / {{ data.capacity }}
        </p>
        <table>
          <thead>
            <tr>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Disponible</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            @for (slot of data.slots; track slot.start_time) {
              <tr>
                <td>{{ slot.start_time }}</td>
                <td>{{ slot.end_time }}</td>
                <td>
                  <span class="badge" [class.ok]="slot.available">
                    {{ slot.available ? 'Libre' : 'Ocupado' }}
                  </span>
                </td>
                <td>{{ slot.reason || '-' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <div class="card">
      <h3>Reservas de instalaciones</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Instalación</th>
            <th>Usuario</th>
            <th>Fecha</th>
            <th>Horario</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          @for (reservation of reservations(); track reservation.id) {
            <tr>
              <td>{{ reservation.id }}</td>
              <td>{{ facilityName(reservation.facility_id) }}</td>
              <td>{{ reservation.user_id }}</td>
              <td>{{ reservation.date }}</td>
              <td>{{ reservation.start_time }} – {{ reservation.end_time }}</td>
              <td><span class="badge">{{ reservation.status }}</span></td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>Reporte de uso</h3>
      <div class="toolbar">
        <div class="field">
          <label for="uPeriod">Periodo</label>
          <input id="uPeriod" type="month" [(ngModel)]="usagePeriod" />
        </div>
        <button class="btn-primary" (click)="loadUsage()">Generar</button>
      </div>
      @if (usage(); as data) {
        <p class="muted">Total de reservas: {{ data.total_reservations }}</p>
        <table>
          <thead>
            <tr>
              <th>Instalación</th>
              <th>Reservas</th>
              <th>Completadas</th>
              <th>Canceladas</th>
              <th>Horas</th>
              <th>Ocupación</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data.items; track item.facility_id) {
              <tr>
                <td>{{ item.facility_name }}</td>
                <td>{{ item.reservations_count }}</td>
                <td>{{ item.completed_count }}</td>
                <td>{{ item.cancelled_count }}</td>
                <td>{{ item.total_hours }}</td>
                <td>{{ item.occupancy_rate }}%</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class OperationsPage {
  private readonly operations = inject(OperationsService);

  readonly facilities = signal<FacilityResponse[]>([]);
  readonly tasks = signal<MaintenanceResponse[]>([]);
  readonly reservations = signal<FacilityReservationResponse[]>([]);
  readonly availability = signal<FacilityAvailabilityResponse | null>(null);
  readonly usage = signal<FacilityUsageResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  readonly priorities = Object.values(Priority);
  readonly taskStatuses = Object.values(TaskStatus);

  facilityForm: FacilityCreate = {
    name: '',
    location: '',
    capacity: 1,
    open_time: '',
    close_time: '',
    is_active: true
  };
  taskForm: MaintenanceCreate = { title: '', priority: Priority.Media, scheduled_date: '' };
  availFacilityId = 0;
  availDate = this.today();
  usagePeriod = this.currentPeriod();

  constructor() {
    this.load();
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
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
    this.operations.listFacilities().subscribe({
      next: (d) => this.facilities.set(d),
      error: (e: Error) => this.fail(e)
    });
    this.operations.listTasks().subscribe({
      next: (d) => this.tasks.set(d),
      error: (e: Error) => this.fail(e)
    });
    this.operations.listReservations().subscribe({
      next: (d) => this.reservations.set(d),
      error: (e: Error) => this.fail(e)
    });
  }

  facilityName(id: number | null): string {
    return this.facilities().find((f) => f.id === id)?.name ?? '—';
  }

  createFacility(): void {
    if (!this.facilityForm.name.trim()) {
      this.fail(new Error('El nombre de la instalación es obligatorio.'));
      return;
    }
    const payload: FacilityCreate = {
      ...this.facilityForm,
      open_time: this.facilityForm.open_time || undefined,
      close_time: this.facilityForm.close_time || undefined
    };
    this.operations.createFacility(payload).subscribe({
      next: () => {
        this.message.set('Instalación creada.');
        this.error.set(null);
        this.facilityForm = {
          name: '',
          location: '',
          capacity: 1,
          open_time: '',
          close_time: '',
          is_active: true
        };
        this.load();
      },
      error: (e: Error) => this.fail(e)
    });
  }

  toggleFacility(facility: FacilityResponse): void {
    this.operations.updateFacility(facility.id, { is_active: !facility.is_active }).subscribe({
      next: () => this.load(),
      error: (e: Error) => this.fail(e)
    });
  }

  removeFacility(facility: FacilityResponse): void {
    this.operations.deleteFacility(facility.id).subscribe({
      next: () => this.load(),
      error: (e: Error) => this.fail(e)
    });
  }

  createTask(): void {
    if (!this.taskForm.title.trim()) {
      this.fail(new Error('El título de la tarea es obligatorio.'));
      return;
    }
    const payload: MaintenanceCreate = {
      title: this.taskForm.title,
      facility_id: this.taskForm.facility_id || undefined,
      priority: this.taskForm.priority,
      scheduled_date: this.taskForm.scheduled_date || undefined
    };
    this.operations.createTask(payload).subscribe({
      next: () => {
        this.message.set('Tarea creada.');
        this.error.set(null);
        this.taskForm = { title: '', priority: Priority.Media, scheduled_date: '' };
        this.load();
      },
      error: (e: Error) => this.fail(e)
    });
  }

  setTaskStatus(task: MaintenanceResponse, status: TaskStatus): void {
    this.operations.updateTask(task.id, { status }).subscribe({
      next: () => {
        this.message.set(`Tarea #${task.id} actualizada a "${status}".`);
        this.load();
      },
      error: (e: Error) => this.fail(e)
    });
  }

  checkAvailability(): void {
    if (!this.availFacilityId || !this.availDate) {
      this.fail(new Error('Selecciona una instalación y una fecha.'));
      return;
    }
    this.operations.availability(this.availFacilityId, this.availDate).subscribe({
      next: (data) => {
        this.availability.set(data);
        this.error.set(null);
      },
      error: (e: Error) => this.fail(e)
    });
  }

  loadUsage(): void {
    if (!this.usagePeriod) return;
    this.operations.usageReport(this.usagePeriod).subscribe({
      next: (data) => this.usage.set(data),
      error: (e: Error) => this.fail(e)
    });
  }
}
