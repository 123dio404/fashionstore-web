import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="card" style="max-width: 26rem; margin: 2rem auto">
      <h2>Iniciar sesión</h2>
      <form (ngSubmit)="submit()">
        <div style="margin-bottom: 0.75rem">
          <label for="email">Correo</label>
          <input id="email" name="email" type="email" [(ngModel)]="email" required />
        </div>
        <div style="margin-bottom: 1rem">
          <label for="password">Contraseña</label>
          <input id="password" name="password" type="password" [(ngModel)]="password" required />
        </div>
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <button class="btn-primary" type="submit" [disabled]="loading()">
          {{ loading() ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>
      <p class="muted" style="margin-top: 1rem">
        ¿No tienes cuenta? <a routerLink="/auth/register">Regístrate</a>
      </p>
    </div>
  `
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/catalog']);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message);
      }
    });
  }
}
