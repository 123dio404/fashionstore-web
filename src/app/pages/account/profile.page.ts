import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile-page',
  imports: [FormsModule],
  template: `
    <div class="card" style="max-width: 30rem">
      <h2>Mi perfil</h2>
      @if (auth.currentUser(); as user) {
        <p class="muted">Rol: <span class="badge">{{ user.role }}</span></p>
      }
      <form (ngSubmit)="submit()">
        <div style="margin-bottom: 0.75rem">
          <label for="fullName">Nombre completo</label>
          <input id="fullName" name="fullName" [(ngModel)]="fullName" />
        </div>
        <div style="margin-bottom: 0.75rem">
          <label for="email">Correo</label>
          <input id="email" name="email" type="email" [(ngModel)]="email" />
        </div>
        <div style="margin-bottom: 1rem">
          <label for="password">Nueva contraseña (opcional)</label>
          <input id="password" name="password" type="password" [(ngModel)]="password" />
        </div>
        @if (message()) {
          <p class="success">{{ message() }}</p>
        }
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <button class="btn-primary" type="submit" [disabled]="loading()">Guardar cambios</button>
      </form>
    </div>
  `
})
export class ProfilePage {
  readonly auth = inject(AuthService);

  fullName = this.auth.currentUser()?.full_name ?? '';
  email = this.auth.currentUser()?.email ?? '';
  password = '';
  readonly loading = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.loading.set(true);
    this.message.set(null);
    this.error.set(null);
    const payload: { full_name?: string; email?: string; password?: string } = {};
    if (this.fullName) payload.full_name = this.fullName;
    if (this.email) payload.email = this.email;
    if (this.password) payload.password = this.password;

    this.auth.updateProfile(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.password = '';
        this.message.set('Perfil actualizado.');
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message);
      }
    });
  }
}
