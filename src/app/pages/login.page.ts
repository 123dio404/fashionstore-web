import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <p class="eyebrow">Bienvenido de nuevo</p>
        <h1>Inicia sesión</h1>
        <p class="auth-lead">Accede a tu cuenta para continuar comprando.</p>

        @if (errorMessage()) {
          <div class="alert alert-error" role="alert">{{ errorMessage() }}</div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="submit()" novalidate>
          <div class="form-field">
            <label for="login-email">Correo electrónico</label>
            <input id="login-email" type="email" formControlName="email" autocomplete="email" placeholder="tu@gmail.com" />
            @if (loginForm.controls.email.touched && loginForm.controls.email.invalid) {
              <span class="field-error">Ingresa un correo electrónico válido.</span>
            }
          </div>

          <div class="form-field">
            <label for="login-password">Contraseña</label>
            <input id="login-password" type="password" formControlName="password" autocomplete="current-password" placeholder="Tu contraseña" />
            @if (loginForm.controls.password.touched && loginForm.controls.password.invalid) {
              <span class="field-error">La contraseña es obligatoria.</span>
            }
          </div>

          <button class="btn btn-primary btn-block" type="submit" [disabled]="loginForm.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Ingresando…' : 'Iniciar sesión' }}
          </button>
        </form>

        <p class="auth-switch">¿Aún no tienes cuenta? <a routerLink="/auth/register">Regístrate</a></p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .auth-page {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: clamp(24px, 6vh, 64px) 0;
    }
    .auth-card {
      width: min(100%, 460px);
      padding: clamp(24px, 5vw, 40px);
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow-2);
    }
    .auth-card h1 {
      margin: 8px 0 0;
      font-size: clamp(1.9rem, 5vw, 2.6rem);
      font-weight: 500;
    }
    .auth-lead { margin: 12px 0 24px; color: var(--muted); }
    .auth-switch { margin: 22px 0 0; color: var(--muted); font-size: 0.88rem; text-align: center; }
  `]
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const { email, password } = this.loginForm.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/catalog']);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isSubmitting.set(false);
      }
    });
  }
}