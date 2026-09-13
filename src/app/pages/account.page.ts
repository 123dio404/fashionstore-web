import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../core/services/auth.service';
import { CartService } from '../core/services/cart.service';
import { CommerceService } from '../core/services/commerce.service';
import { ReservationResponse, ReservationStatus, SaleResponse } from '../models';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="container page">
      <div class="page-head">
        <p class="eyebrow">Tu espacio</p>
        <h1 class="page-title">Mi cuenta</h1>
      </div>

      <div class="tabs" role="tablist" aria-label="Secciones de cuenta">
        <button class="tab" [class.active]="tab() === 'perfil'" (click)="tab.set('perfil')" role="tab">Perfil</button>
        <button class="tab" [class.active]="tab() === 'pedidos'" (click)="tab.set('pedidos')" role="tab">Mis pedidos</button>
        <button class="tab" [class.active]="tab() === 'reservas'" (click)="tab.set('reservas')" role="tab">Reservaciones</button>
      </div>

      @if (tab() === 'perfil') {
        <div class="card">
          <h3>Información personal</h3>
          @if (profileMessage()) {
            <div class="alert alert-success" role="status">{{ profileMessage() }}</div>
          }
          @if (profileError()) {
            <div class="alert alert-error" role="alert">{{ profileError() }}</div>
          }
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" novalidate>
            <div class="form-grid">
              <div class="form-field">
                <label for="account-name">Nombre</label>
                <input id="account-name" type="text" formControlName="full_name" autocomplete="name" />
                @if (profileForm.controls.full_name.touched && profileForm.controls.full_name.invalid) {
                  <span class="field-error">Ingresa tu nombre.</span>
                }
              </div>
              <div class="form-field">
                <label for="account-email">Correo electrónico</label>
                <input id="account-email" type="email" formControlName="email" autocomplete="email" />
                @if (profileForm.controls.email.touched && profileForm.controls.email.invalid) {
                  <span class="field-error">Ingresa un correo válido.</span>
                }
              </div>
              <div class="form-field full">
                <label for="account-pass">Nueva contraseña (dejar vacío para no cambiar)</label>
                <input id="account-pass" type="password" formControlName="password" autocomplete="new-password" />
                @if (profileForm.controls.password.touched && profileForm.controls.password.invalid) {
                  <span class="field-error">La contraseña debe tener al menos 8 caracteres.</span>
                }
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" type="submit" [disabled]="profileForm.invalid || profileSaving()">
                {{ profileSaving() ? 'Guardando…' : 'Guardar cambios' }}
              </button>
              <button class="btn btn-ghost" type="button" (click)="logout()">Cerrar sesión</button>
            </div>
          </form>
        </div>
      }

      @if (tab() === 'pedidos') {
        @if (salesLoading()) {
          <div class="loading-row"><span class="spinner"></span> Cargando pedidos…</div>
        }
        @if (!salesLoading() && sales().length) {
          <div class="card-stack">
            @for (sale of sales(); track sale.id) {
              <div class="card order-card">
                <div class="flex-between">
                  <div>
                    <strong class="strong">Pedido #{{ sale.id }}</strong>
                    <span class="badge badge-info" style="margin-left:8px">{{ sale.sale_type }}</span>
                  </div>
                  <span class="small muted-2">{{ sale.sale_date | date:'medium' }}</span>
                </div>
                <div class="order-items mt-1">
                  @for (item of sale.items; track item.id) {
                    <div class="flex-between small">
                      <span>Artículo #{{ item.stock_id }} × {{ item.quantity }}</span>
                      <span>{{ item.unit_price * item.quantity | currency }}</span>
                    </div>
                  }
                </div>
                <div class="flex-between mt-1 strong">
                  <span>Total</span>
                  <span>{{ sale.total | currency }}</span>
                </div>
              </div>
            }
          </div>
        }
        @if (!salesLoading() && !sales().length) {
          <div class="empty">
            <div class="empty-icon">📦</div>
            <h3>Sin pedidos aún</h3>
            <p>Cuando realices una compra, tus pedidos aparecerán aquí.</p>
            <a class="btn btn-primary mt-1" routerLink="/catalog">Explorar el catálogo</a>
          </div>
        }
      }

      @if (tab() === 'reservas') {
        @if (reservationsLoading()) {
          <div class="loading-row"><span class="spinner"></span> Cargando reservaciones…</div>
        }
        @if (!reservationsLoading() && reservations().length) {
          <div class="card-stack">
            @for (res of reservations(); track res.id) {
              <div class="card order-card">
                <div class="flex-between">
                  <div>
                    <strong class="strong">Reservación #{{ res.id }}</strong>
                    <span class="badge badge-accent" style="margin-left:8px">{{ res.status }}</span>
                  </div>
                  <span class="small muted-2">{{ res.reservation_date }} · {{ res.reservation_time }}</span>
                </div>
                <div class="small muted mt-1">Sucursal #{{ res.branch_id }} · {{ res.items.length }} {{ res.items.length === 1 ? 'artículo' : 'artículos' }}</div>
                @if (res.status !== 'cancelada') {
                  <div class="mt-1">
                    <button class="btn btn-danger btn-sm" (click)="cancelReservation(res)">Cancelar reservación</button>
                  </div>
                }
              </div>
            }
          </div>
        }
        @if (!reservationsLoading() && !reservations().length) {
          <div class="empty">
            <div class="empty-icon">📅</div>
            <h3>Sin reservaciones</h3>
            <p>Puedes crear reservaciones desde la página de cada producto.</p>
            <a class="btn btn-primary mt-1" routerLink="/catalog">Ir al catálogo</a>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .card-stack { display: grid; gap: 16px; }
    .order-card { padding: 18px 20px; }
    .order-items { display: grid; gap: 4px; padding: 8px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
  `]
})
export class AccountPage {
  private readonly auth = inject(AuthService);
  private readonly commerce = inject(CommerceService);
  private readonly cartSvc = inject(CartService);

  readonly tab = signal<'perfil' | 'pedidos' | 'reservas'>('perfil');

  readonly profileForm = new FormGroup({
    full_name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('')
  });
  profileSaving = signal(false);
  profileMessage = signal('');
  profileError = signal('');

  readonly sales = signal<SaleResponse[]>([]);
  salesLoading = signal(true);

  readonly reservations = signal<ReservationResponse[]>([]);
  reservationsLoading = signal(true);

  constructor() {
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.patchValue({ full_name: user.full_name, email: user.email });
    } else {
      this.auth.getCurrentUser().subscribe({
        next: (u) => this.profileForm.patchValue({ full_name: u.full_name, email: u.email })
      });
    }
    this.loadSales();
    this.loadReservations();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.profileSaving.set(true);
    this.profileMessage.set('');
    this.profileError.set('');
    const { full_name, email, password } = this.profileForm.getRawValue();
    this.auth.updateProfile({ full_name, email, password: password || undefined }).subscribe({
      next: () => {
        this.profileSaving.set(false);
        this.profileMessage.set('Perfil actualizado correctamente.');
      },
      error: (e: Error) => {
        this.profileSaving.set(false);
        this.profileError.set(e.message || 'No se pudo actualizar el perfil.');
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.cartSvc.reset();
    location.href = '/';
  }

  private loadSales(): void {
    this.salesLoading.set(true);
    this.commerce.listSales().subscribe({
      next: (v) => {
        this.sales.set(v);
        this.salesLoading.set(false);
      },
      error: () => this.salesLoading.set(false)
    });
  }

  private loadReservations(): void {
    this.reservationsLoading.set(true);
    this.commerce.listReservations().subscribe({
      next: (v) => {
        this.reservations.set(v);
        this.reservationsLoading.set(false);
      },
      error: () => this.reservationsLoading.set(false)
    });
  }

  cancelReservation(res: ReservationResponse): void {
    if (!confirm(`¿Cancelar la reservación #${res.id}?`)) { return; }
    this.commerce.updateReservation(res.id, { status: ReservationStatus.Cancelada }).subscribe({
      next: () => this.loadReservations(),
      error: () => alert('No se pudo cancelar.')
    });
  }
}