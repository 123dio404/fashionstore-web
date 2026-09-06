import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page" aria-labelledby="login-title">
      <div class="auth-card">
        <p class="eyebrow">Bienvenido de nuevo</p>
        <h1 id="login-title">Inicia sesión</h1>
        <p class="intro">Accede a tu cuenta para continuar comprando.</p>

        <form [formGroup]="loginForm" (ngSubmit)="submit()" novalidate>
          <label for="login-email">Correo electrónico</label>
          <input id="login-email" type="email" formControlName="email" autocomplete="email" placeholder="tu@gmail.com" />
          @if (loginForm.controls.email.touched && loginForm.controls.email.invalid) {
            <small class="error">Ingresa un correo electrónico válido.</small>
          }

          <label for="login-password">Contraseña</label>
          <input id="login-password" type="password" formControlName="password" autocomplete="current-password" placeholder="Tu contraseña" />
          @if (loginForm.controls.password.touched && loginForm.controls.password.invalid) {
            <small class="error">La contraseña es obligatoria.</small>
          }

          @if (errorMessage) {
            <p class="server-error" role="alert">{{ errorMessage }}</p>
          }

          <button type="submit" [disabled]="loginForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Ingresando...' : 'Iniciar sesión' }}
          </button>
        </form>

        <p class="switch-auth">¿Aún no tienes cuenta? <a routerLink="/auth/register">Regístrate</a></p>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .auth-page { display: flex; justify-content: center; padding: 48px 0 64px; }
    .auth-card { width: min(100%, 440px); padding: 40px; background: #fffaf2; border: 1px solid rgba(29, 41, 37, .14); }
    .eyebrow { margin: 0 0 14px; color: #bb5a3c; font-size: .72rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
    h1 { margin: 0; font-family: Georgia, serif; font-size: 3.3rem; font-weight: 400; letter-spacing: -.04em; line-height: 1; }
    .intro { margin: 16px 0 30px; color: #52605a; line-height: 1.6; }
    form { display: grid; gap: 8px; }
    label { margin-top: 10px; font-size: .82rem; font-weight: 700; }
    input { width: 100%; box-sizing: border-box; padding: 14px; border: 1px solid #b9c0ba; background: #fff; color: #1d2925; font: inherit; }
    input:focus { outline: 2px solid #bb5a3c; outline-offset: 1px; }
    button { margin-top: 16px; padding: 15px; border: 0; background: #1d2925; color: #fffaf2; cursor: pointer; font: inherit; font-weight: 700; }
    button:disabled { cursor: not-allowed; opacity: .55; }
    .error, .server-error { color: #a23f2b; font-size: .78rem; }
    .server-error { margin: 12px 0 0; }
    .switch-auth { margin: 24px 0 0; color: #52605a; font-size: .88rem; text-align: center; }
    a { color: #1d2925; font-weight: 700; }
    @media (max-width: 520px) { .auth-card { padding: 28px 22px; } }
  `]
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  isSubmitting = false;
  errorMessage = '';

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/catalog']),
      error: (error: Error) => {
        this.errorMessage = error.message;
        this.isSubmitting = false;
      }
    });
  }
}