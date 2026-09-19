import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="card" style="max-width: 26rem; margin: 2rem auto">
      <h2>Crear cuenta</h2>
      <form (ngSubmit)="submit()">
        <div style="margin-bottom: 0.75rem">
          <label for="fullName">Nombre completo</label>
          <input id="fullName" name="fullName" [(ngModel)]="fullName" required />
        </div>
        <div style="margin-bottom: 0.75rem">
          <label for="email">Correo</label>
          <input id="email" name="email" type="email" [(ngModel)]="email" required />
        </div>
        <div style="margin-bottom: 1rem">
          <label for="password">Contraseña (mínimo 8 caracteres)</label>
          <input id="password" name="password" type="password" [(ngModel)]="password" required />
        </div>
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        @if (done()) {
          <p class="success">¡Cuenta creada! Ya puedes iniciar sesión.</p>
        }
        <button class="btn-primary" type="submit" [disabled]="loading()">
          {{ loading() ? 'Creando...' : 'Registrarme' }}
        </button>
      </form>
      <p class="muted" style="margin-top: 1rem">
        ¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a>
      </p>
    </div>
  `
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly done = signal(false);

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.done.set(false);
    this.auth
      .register({ full_name: this.fullName, email: this.email, password: this.password })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.done.set(true);
          setTimeout(() => this.router.navigate(['/auth/login']), 800);
        },
        error: (err: Error) => {
          this.loading.set(false);
          this.error.set(err.message);
        }
      });
  }
}
