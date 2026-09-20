import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { UsersService } from '../../core/services/users.service';
import { Role, UserCreate, UserResponse, UserUpdate } from '../../models';
import { UiDrawerComponent } from '../../shared/ui/drawer.component';

/** CU03 — Gestionar usuarios y roles: tabla con filtros y alta/edición en panel lateral. */
@Component({
  selector: 'app-users-page',
  imports: [CommonModule, FormsModule, UiDrawerComponent],
  templateUrl: './users.page.html'
})
export class UsersPage {
  private readonly users = inject(UsersService);

  readonly list = signal<UserResponse[]>([]);
  readonly roles = Object.values(Role);
  readonly drawerOpen = signal(false);
  readonly editing = signal<UserResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  search = '';
  roleFilter: Role | null = null;

  form: UserCreate = {
    full_name: '',
    email: '',
    password: '',
    role: Role.Cliente,
    is_active: true
  };

  /** Filtro por nombre, correo y rol (los cambios se ven al instante). */
  get filtered(): UserResponse[] {
    const term = this.search.trim().toLowerCase();
    return this.list().filter((user) => {
      if (this.roleFilter && user.role !== this.roleFilter) return false;
      if (!term) return true;
      return (
        user.full_name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
      );
    });
  }

  constructor() {
    this.load();
  }

  initials(user: UserResponse): string {
    const parts = user.full_name.split(' ').filter(Boolean).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'FS';
  }

  load(): void {
    this.users.list().subscribe({
      next: (data) => this.list.set(data),
      error: (err: Error) => this.fail(err)
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form = {
      full_name: '',
      email: '',
      password: '',
      role: Role.Cliente,
      is_active: true
    };
    this.message.set(null);
    this.error.set(null);
    this.drawerOpen.set(true);
  }

  openEdit(user: UserResponse): void {
    this.editing.set(user);
    this.form = {
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active
    };
    this.message.set(null);
    this.error.set(null);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editing.set(null);
  }

  save(): void {
    this.message.set(null);
    this.error.set(null);

    const current = this.editing();
    if (!this.form.full_name.trim() || !this.form.email.trim()) {
      this.fail(new Error('Nombre y correo son obligatorios.'));
      return;
    }
    if (!current && !this.form.password) {
      this.fail(new Error('La contraseña es obligatoria al crear la cuenta.'));
      return;
    }

    if (!current) {
      this.users.create(this.form).subscribe({
        next: () => {
          this.message.set('Usuario creado.');
          this.closeDrawer();
          this.load();
        },
        error: (err: Error) => this.fail(err)
      });
      return;
    }

    const payload: UserUpdate = {
      full_name: this.form.full_name,
      email: this.form.email,
      role: this.form.role,
      is_active: this.form.is_active
    };
    if (this.form.password) {
      payload.password = this.form.password;
    }

    this.users.update(current.id, payload).subscribe({
      next: () => {
        this.message.set('Usuario actualizado.');
        this.closeDrawer();
        this.load();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  toggleActive(user: UserResponse): void {
    this.users.update(user.id, { is_active: !user.is_active }).subscribe({
      next: () => {
        this.message.set(user.is_active ? 'Cuenta desactivada.' : 'Cuenta activada.');
        this.load();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  private fail(err: Error): void {
    this.error.set(err.message);
    this.message.set(null);
  }
}
