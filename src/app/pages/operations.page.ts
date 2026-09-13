import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { OperationsService } from '../core/services/operations.service';
import {
  FacilityAvailabilityResponse,
  FacilityReservationResponse,
  FacilityResponse,
  FacilityUsageResponse,
  MaintenanceResponse,
  Priority,
  TaskStatus
} from '../models';

type OpTab = 'instalaciones' | 'mantenimiento' | 'reporte';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="container page">
      <div class="page-head">
        <p class="eyebrow">Área operativa</p>
        <h1 class="page-title">Operaciones</h1>
        <p class="page-lead">Instalaciones, mantenimiento y uso de espacios.</p>
      </div>

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }
      @if (message()) {
        <div class="alert alert-success">{{ message() }}</div>
      }

      <div class="tabs" role="tablist" aria-label="Secciones">
        <button class="tab" [class.active]="tab() === 'instalaciones'" (click)="tab.set('instalaciones')" role="tab">Instalaciones</button>
        <button class="tab" [class.active]="tab() === 'mantenimiento'" (click)="tab.set('mantenimiento')" role="tab">Mantenimiento</button>
        <button class="tab" [class.active]="tab() === 'reporte'" (click)="tab.set('reporte')" role="tab">Reporte de uso</button>
      </div>

      @if (tab() === 'instalaciones') {
        <section class="card">
          <div class="card-head">
            <h3>Instalaciones</h3>
            <button class="btn btn-ghost btn-sm" type="button" (click)="load()">Actualizar</button>
          </div>
          @if (facilitiesLoading()) {
            <div class="loading-row"><span class="spinner"></span> Cargando…</div>
          }
          @if (!facilitiesLoading() && facilities().length) {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Instalación</th>
                    <th>Ubicación</th>
                    <th>Capacidad</th>
                    <th>Horario</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (f of facilities(); track f.id) {
                    <tr>
                      <td class="strong">{{ f.name }}</td>
                      <td class="small muted">{{ f.location || '—' }}</td>
                      <td>{{ f.capacity }}</td>
                      <td class="small muted-2">{{ f.open_time }} – {{ f.close_time }}</td>
                      <td>
                        @if (f.is_active) {
                          <span class="badge badge-success">Activa</span>
                        } @else {
                          <span class="badge badge-neutral">Inactiva</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @if (!facilitiesLoading() && !facilities().length) {
            <div class="empty"><h3>Sin instalaciones</h3><p>Registra la primera instalación.</p></div>
          }
        </section>

        <section class="card mt-2">
          <h3>Nueva instalación</h3>
          <form [formGroup]="facilityForm" (ngSubmit)="createFacility()">
            <div class="form-grid">
              <div class="form-field">
                <label>Nombre</label>
                <input type="text" formControlName="name" />
              </div>
              <div class="form-field">
                <label>Ubicación</label>
                <input type="text" formControlName="location" />
              </div>
              <div class="form-field">
                <label>Capacidad</label>
                <input type="number" formControlName="capacity" min="1" />
              </div>
              <div class="form-field">
                <label>Apertura</label>
                <input type="time" formControlName="open_time" />
              </div>
              <div class="form-field">
                <label>Cierre</label>
                <input type="time" formControlName="close_time" />
              </div>
              <div class="form-field full">
                <label>Descripción</label>
                <textarea formControlName="description"></textarea>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary btn-sm" type="submit" [disabled]="facilityForm.invalid || saving()">
                {{ saving() ? 'Guardando…' : 'Crear instalación' }}
              </button>
            </div>
          </form>
        </section>

        <section class="card mt-2">
          <div class="card-head">
            <h3>Disponibilidad</h3>
            <form class="avail-form" [formGroup]="availForm">
              <select formControlName="facility_id">
                @for (f of facilities(); track f.id) {
                  <option [value]="f.id">{{ f.name }}</option>
                }
              </select>
              <input type="date" formControlName="date" />
              <button class="btn btn-outline btn-sm" type="button" (click)="checkAvailability()">Consultar</button>
            </form>
          </div>
          @if (availability()) {
            <div class="avail-summary">
              <p class="small muted mb-0">
                <strong>{{ availability()?.facility_name }}</strong> · {{ availability()?.date }} ·
                {{ availability()?.booked }} / {{ availability()?.capacity }} reservados
              </p>
              <div class="slot-grid">
                @for (slot of availability()?.slots ?? []; track $index) {
                  <span class="slot" [class.available]="slot.available">
                    {{ slot.start_time }}–{{ slot.end_time }}
                  </span>
                }
              </div>
            </div>
          }
        </section>
      }

      @if (tab() === 'mantenimiento') {
        <section class="card">
          <div class="card-head">
            <h3>Tareas de mantenimiento</h3>
            <button class="btn btn-ghost btn-sm" type="button" (click)="load()">Actualizar</button>
          </div>
          @if (tasks().length) {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tarea</th>
                    <th>Instalación</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Programada</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of tasks(); track t.id) {
                    <tr>
                      <td class="strong">{{ t.title }}</td>
                      <td class="small muted">{{ facilityName(t.facility_id) }}</td>
                      <td><span class="badge" [class]="priorityBadge(t.priority)">{{ t.priority }}</span></td>
                      <td><span class="badge" [class]="statusBadge(t.status)">{{ t.status }}</span></td>
                      <td class="small muted-2">{{ t.scheduled_date || '—' }}</td>
                      <td>
                        @if (t.status === 'pendiente') {
                          <button class="btn btn-ghost btn-sm" type="button" (click)="setTaskStatus(t, taskStatuses.EnProgreso)">Iniciar</button>
                        }
                        @if (t.status === 'en_progreso') {
                          <button class="btn btn-ghost btn-sm" type="button" (click)="setTaskStatus(t, taskStatuses.Completada)">Completar</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @if (!tasks().length) {
            <div class="empty"><h3>Sin tareas</h3><p>No hay tareas de mantenimiento registradas.</p></div>
          }
        </section>

        <section class="card mt-2">
          <h3>Nueva tarea</h3>
          <form [formGroup]="taskForm" (ngSubmit)="createTask()">
            <div class="form-grid">
              <div class="form-field full">
                <label>Título</label>
                <input type="text" formControlName="title" />
              </div>
              <div class="form-field">
                <label>Instalación</label>
                <select formControlName="facility_id">
                  <option value="">—</option>
                  @for (f of facilities(); track f.id) {
                    <option [value]="f.id">{{ f.name }}</option>
                  }
                </select>
              </div>
              <div class="form-field">
                <label>Prioridad</label>
                <select formControlName="priority">
                  @for (p of priorities; track p) {
                    <option [value]="p">{{ p }}</option>
                  }
                </select>
              </div>
              <div class="form-field">
                <label>Fecha programada</label>
                <input type="date" formControlName="scheduled_date" />
              </div>
              <div class="form-field full">
                <label>Descripción</label>
                <textarea formControlName="description"></textarea>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary btn-sm" type="submit" [disabled]="taskForm.invalid || saving()">
                {{ saving() ? 'Guardando…' : 'Crear tarea' }}
              </button>
            </div>
          </form>
        </section>
      }

      @if (tab() === 'reporte') {
        <section class="card">
          <div class="card-head">
            <h3>Reporte de uso por period</h3>
            <form class="avail-form" [formGroup]="usageForm">
              <input type="month" formControlName="period" />
              <button class="btn btn-outline btn-sm" type="button" (click)="loadUsage()">Generar</button>
            </form>
          </div>
          @if (usage()) {
            <div class="stat-grid mb-2">
              <div class="stat-card">
                <span class="stat-label">Periodo</span>
                <span class="stat-value">{{ usage()?.period }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Reservaciones</span>
                <span class="stat-value">{{ usage()?.total_reservations }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Instalaciones</span>
                <span class="stat-value">{{ usage()?.items?.length }}</span>
              </div>
            </div>
            @if ((usage()?.items ?? []).length) {
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Instalación</th>
                      <th>Reservaciones</th>
                      <th>Completadas</th>
                      <th>Canceladas</th>
                      <th>Ocupación</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of usage()?.items ?? []; track $index) {
                      <tr>
                        <td class="strong">{{ item.facility_name }}</td>
                        <td>{{ item.reservations_count }}</td>
                        <td>{{ item.completed_count }}</td>
                        <td>{{ item.cancelled_count }}</td>
                        <td>{{ item.occupancy_rate }}%</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .avail-form { display: flex; gap: 8px; flex-wrap: wrap; }
    .avail-form select, .avail-form input { width: auto; }
    .avail-summary { margin-top: 10px; }
    .slot-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .slot {
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 0.76rem;
      font-weight: 700;
      background: var(--sage-2);
      color: var(--muted-2);
    }
    .slot.available { background: var(--success-bg); color: var(--success); }
  `]
})
export class OperationsPage {
  private operations = inject(OperationsService);

  readonly priorities: Priority[] = [Priority.Baja, Priority.Media, Priority.Alta];
  readonly taskStatuses = TaskStatus;

  readonly tab = signal<OpTab>('instalaciones');
  readonly facilities = signal<FacilityResponse[]>([]);
  readonly facilitiesLoading = signal(true);
  readonly tasks = signal<MaintenanceResponse[]>([]);
  readonly availability = signal<FacilityAvailabilityResponse | null>(null);
  readonly usage = signal<FacilityUsageResponse | null>(null);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  readonly facilityForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl(''),
    location: new FormControl(''),
    capacity: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    open_time: new FormControl(''),
    close_time: new FormControl('')
  });

  readonly taskForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl(''),
    facility_id: new FormControl<number | null>(null),
    priority: new FormControl<Priority>(Priority.Media, { nonNullable: true }),
    scheduled_date: new FormControl('')
  });

  readonly availForm = new FormGroup({
    facility_id: new FormControl<number | null>(null),
    date: new FormControl(this.today(), { nonNullable: true })
  });

  readonly usageForm = new FormGroup({
    period: new FormControl(this.currentPeriod(), { nonNullable: true })
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.operations.listFacilities(false).subscribe({
      next: (v) => {
        this.facilities.set(v);
        this.facilitiesLoading.set(false);
        if (!this.availForm.controls.facility_id.value && v.length) {
          this.availForm.patchValue({ facility_id: v[0].id });
        }
      },
      error: () => this.facilitiesLoading.set(false)
    });
    this.operations.listTasks().subscribe({
      next: (v) => this.tasks.set(v),
      error: () => this.tasks.set([])
    });
  }

  createFacility(): void {
    if (this.facilityForm.invalid) { return; }
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    const raw = this.facilityForm.getRawValue();
    this.operations
      .createFacility({
        name: raw.name,
        description: raw.description || undefined,
        location: raw.location || undefined,
        capacity: Number(raw.capacity),
        open_time: raw.open_time || undefined,
        close_time: raw.close_time || undefined
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.message.set('Instalación creada.');
          this.facilityForm.reset({ capacity: 1 });
          this.load();
        },
        error: (e: Error) => {
          this.saving.set(false);
          this.error.set(e.message || 'No se pudo crear la instalación.');
        }
      });
  }

  createTask(): void {
    if (this.taskForm.invalid) { return; }
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    const raw = this.taskForm.getRawValue();
    this.operations
      .createTask({
        title: raw.title,
        description: raw.description || undefined,
        facility_id: raw.facility_id ?? undefined,
        priority: raw.priority,
        scheduled_date: raw.scheduled_date || undefined
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.message.set('Tarea creada.');
          this.taskForm.reset({ priority: Priority.Media });
          this.load();
        },
        error: (e: Error) => {
          this.saving.set(false);
          this.error.set(e.message || 'No se pudo crear la tarea.');
        }
      });
  }

  setTaskStatus(task: MaintenanceResponse, status: TaskStatus): void {
    this.operations.updateTask(task.id, { status }).subscribe({
      next: () => {
        this.message.set('Estado actualizado.');
        this.load();
      },
      error: () => this.error.set('No se pudo actualizar el estado.')
    });
  }

  checkAvailability(): void {
    const facilityId = this.availForm.controls.facility_id.value;
    const date = this.availForm.controls.date.value;
    if (!facilityId || !date) {
      this.error.set('Selecciona instalación y fecha.');
      return;
    }
    this.operations.availability(facilityId, date).subscribe({
      next: (v) => {
        this.availability.set(v);
        this.error.set('');
      },
      error: () => this.error.set('No se pudo consultar la disponibilidad.')
    });
  }

  loadUsage(): void {
    const period = this.usageForm.controls.period.value;
    if (!period) { return; }
    this.operations.usageReport(period).subscribe({
      next: (v) => this.usage.set(v),
      error: () => this.error.set('No se pudo generar el reporte.')
    });
  }

  facilityName(id: number | null): string {
    return this.facilities().find((f) => f.id === id)?.name ?? '—';
  }

  priorityBadge(p: Priority): string {
    switch (p) {
      case 'alta': return 'badge-warning';
      case 'media': return 'badge-info';
      default: return 'badge-neutral';
    }
  }

  statusBadge(s: TaskStatus): string {
    switch (s) {
      case 'completada': return 'badge-success';
      case 'en_progreso': return 'badge-info';
      case 'cancelada': return 'badge-danger';
      default: return 'badge-warning';
    }
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private currentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}