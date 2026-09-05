import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page" aria-labelledby="register-title">
      <div class="auth-card">
        <p class="eyebrow">Únete a FashionStore</p>
        <h1 id="register-title">Crea tu cuenta</h1>
        <p class="intro">Regístrate para guardar tus favoritos y comprar con facilidad.</p>

        <form [formGroup]="registerForm" (ngSubmit)="submit()" novalidate>
          <label for="register-name">Nombre completo</label>
          <input id="register-name" type="text" formControlName="full_name" autocomplete="name" placeholder="Tu nombre" />
          @if (registerForm.controls.full_name.touched && registerForm.controls.full_name.invalid) {
            <small class="error">Escribe tu nombre completo (mínimo 2 caracteres).</small>
          }

          <label for="register-email">Correo electrónico</label>
          <input id="register-email" type="email" formControlName="email" autocomplete="email" placeholder="tu@gmail.com" />
          @if (registerForm.controls.email.touched && registerForm.controls.email.invalid) {
            <small class="error">Ingresa un correo electrónico válido.</small>
          }

          <label for="register-phone">Teléfono</label>
          <input id="register-phone" type="tel" formControlName="phone" autocomplete="tel" placeholder="987654321" />
          @if (registerForm.controls.phone.touched && registerForm.controls.phone.invalid) {
            <small class="error">Ingresa un teléfono válido de 7 a 15 dígitos.</small>
          }

          <label for="register-password">Contraseña</label>
          <input id="register-password" type="password" formControlName="password" autocomplete="new-password" placeholder="Crea una contraseña segura" />
          <small class="password-help">Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.</small>
          @if (registerForm.controls.password.touched && registerForm.controls.password.invalid) {
            <small class="error">La contraseña no cumple los requisitos de seguridad.</small>
          }

          @if (errorMessage) {
            <p class="server-error" role="alert">{{ errorMessage }}</p>
          }

          <button type="submit" [disabled]="registerForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Creando cuenta...' : 'Registrarme' }}
          </button>
        </form>

        <p class="switch-auth">¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a></p>
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
    .password-help { color: #6d7871; font-size: .73rem; line-height: 1.4; }
    .error, .server-error { color: #a23f2b; font-size: .78rem; }
    .server-error { margin: 12px 0 0; }
    .switch-auth { margin: 24px 0 0; color: #52605a; font-size: .88rem; text-align: center; }
    a { color: #1d2925; font-weight: 700; }
    @media (max-width: 520px) { .auth-card { padding: 28px 22px; } }
  `]
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly registerForm = this.formBuilder.nonNullable.group({
    full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{7,15}$/)]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(128),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
    ]]
  });
  isSubmitting = false;
  errorMessage = '';

  submit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    const { full_name, email, password } = this.registerForm.getRawValue();
    this.authService.register({ full_name, email, password }).subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: (error: Error) => {
        this.errorMessage = error.message;
        this.isSubmitting = false;
      }
    });
  }
}