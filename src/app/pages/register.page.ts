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
        <p class="eyebrow">Únete a FashionStore</p>
        <h1>Crea tu cuenta</h1>
        <p class="auth-lead">Regístrate para guardar tus favoritos y comprar con facilidad.</p>

        @if (errorMessage()) {
          <div class="alert alert-error" role="alert">{{ errorMessage() }}</div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="submit()" novalidate>
          <div class="form-field">
            <label for="register-name">Nombre completo</label>
            <input id="register-name" type="text" formControlName="full_name" autocomplete="name" placeholder="Tu nombre" />
            @if (registerForm.controls.full_name.touched && registerForm.controls.full_name.invalid) {
              <span class="field-error">Escribe tu nombre completo (mínimo 2 caracteres).</span>
            }
          </div>

          <div class="form-field">
            <label for="register-email">Correo electrónico</label>
            <input id="register-email" type="email" formControlName="email" autocomplete="email" placeholder="tu@gmail.com" />
            @if (registerForm.controls.email.touched && registerForm.controls.email.invalid) {
              <span class="field-error">Ingresa un correo electrónico válido.</span>
            }
          </div>

          <div class="form-field">
            <label for="register-password">Contraseña</label>
            <input id="register-password" type="password" formControlName="password" autocomplete="new-password" placeholder="Crea una contraseña segura" />
            <span class="hint">Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.</span>
            @if (registerForm.controls.password.touched && registerForm.controls.password.invalid) {
              <span class="field-error">La contraseña no cumple los requisitos de seguridad.</span>
            }
          </div>

          <button class="btn btn-primary btn-block" type="submit" [disabled]="registerForm.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Creando cuenta…' : 'Registrarme' }}
          </button>
        </form>

        <p class="auth-switch">¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a></p>
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
    .hint { font-size: 0.75rem; color: var(--muted-2); line-height: 1.4; display: block; }
  `]
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly registerForm = new FormGroup({
    full_name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(150)]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(320)]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
      ]
    })
  });

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  submit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const { full_name, email, password } = this.registerForm.getRawValue();
    this.authService.register({ full_name, email, password }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/auth/login']);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isSubmitting.set(false);
      }
    });
  }
}