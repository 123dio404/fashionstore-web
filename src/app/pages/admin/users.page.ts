import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { UsersService } from '../../core/services/users.service';
import { Role, UserCreate, UserResponse } from '../../models';

@Component({
  selector: 'app-users-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Usuarios y roles</h2>

    <div class="row" style="margin-bottom: 1rem">
      <button class="btn-primary" (click)="showForm.set(!showForm())">
        {{ showForm() ? 'Cerrar' : 'Nuevo usuario' }}
      </button>
      @if (message()) {
        <span class="success">{{ message() }}</span>
      }
      @if (error()) {
        <span class="error">{{ error() }}</span>
      }
    </div>

    @if (showForm()) {
      <div class="card">
        <div class="grid-2">
          <div>
            <label for="fullName">Nombre completo</label>
            <input id="fullName" [(ngModel)]="form.full_name" />
          </div>
          <div>
            <label for="email">Correo</label>
            <input id="email" type="email" [(ngModel)]="form.email" />
          </div>
          <div>
            <label for="password">Contraseña</label>
            <input id="password" type="password" [(ngModel)]="form.password" />
          </div>
          <div>
            <label for="role">Rol</label>
            <select id="role" [(ngModel)]="form.role">
              @for (role of roles; track role) {
                <option [ngValue]="role">{{ role }}</option>
              }
            </select>
          </div>
        </div>
        <br />
        <button class="btn-primary" (click)="create()">Crear usuario</button>
      </div>
    }

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (user of list(); track user.id) {
            <tr>
              <td>{{ user.id }}</td>
              <td>{{ user.full_name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <select [ngModel]="user.role" (ngModelChange)="changeRole(user, $event)">
                  @for (role of roles; track role) {
                    <option [ngValue]="role">{{ role }}</option>
                  }
                </select>
              </td>
              <td>
                <span class="badge" [class.ok]="user.is_active">
                  {{ user.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <button class="btn" (click)="toggleActive(user)">
                  {{ user.is_active ? 'Desactivar' : 'Activar' }}
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class UsersPage {
  private readonly users = inject(UsersService);

  readonly list = signal<UserResponse[]>([]);
  readonly showForm = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly roles = Object.values(Role);

  form: UserCreate = {
    full_name: '',
    email: '',
    password: '',
    role: Role.Cliente,
    is_active: true
  };

  constructor() {
    this.load();
  }

  load(): void {
    this.users.list().subscribe({
      next: (data) => this.list.set(data),
      error: (err: Error) => this.error.set(err.message)
    });
  }

  create(): void {
    this.message.set(null);
    this.error.set(null);
    this.users.create(this.form).subscribe({
      next: () => {
        this.message.set('Usuario creado.');
        this.form = { full_name: '', email: '', password: '', role: Role.Cliente, is_active: true };
        this.showForm.set(false);
        this.load();
      },
      error: (err: Error) => this.error.set(err.message)
    });
  }

  changeRole(user: UserResponse, role: Role): void {
    this.users.update(user.id, { role }).subscribe({
      next: () => this.load(),
      error: (err: Error) => this.error.set(err.message)
    });
  }

  toggleActive(user: UserResponse): void {
    this.users.update(user.id, { is_active: !user.is_active }).subscribe({
      next: () => this.load(),
      error: (err: Error) => this.error.set(err.message)
    });
  }
}
