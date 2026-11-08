import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

/** CU02 — Perfil del usuario: datos de acceso + resumen de la cuenta. */
@Component({
  selector: 'app-profile-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss'
})
export class ProfilePage {
  readonly auth = inject(AuthService);
  readonly user = this.auth.currentUser;

  readonly loading = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly initials = computed(() => {
    const name = this.user()?.full_name ?? '';
    const parts = name.split(' ').filter(Boolean).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'FS';
  });

  fullName = this.auth.currentUser()?.full_name ?? '';
  email = this.auth.currentUser()?.email ?? '';
  password = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  readonly pwdLoading = signal(false);
  readonly pwdSuccess = signal<string | null>(null);
  readonly pwdError = signal<string | null>(null);

  get hasPwdMinLength(): boolean { return this.newPassword.length >= 8; }
  get hasPwdUpper(): boolean { return /[A-Z]/.test(this.newPassword); }
  get hasPwdLower(): boolean { return /[a-z]/.test(this.newPassword); }
  get hasPwdDigit(): boolean { return /[0-9]/.test(this.newPassword); }
  get hasPwdSpecial(): boolean { return /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/~`';]/.test(this.newPassword); }
  get passwordsMatch(): boolean { return this.newPassword.length > 0 && this.newPassword === this.confirmPassword; }
  get isNewPasswordValid(): boolean {
    return this.hasPwdMinLength && this.hasPwdUpper && this.hasPwdLower && this.hasPwdDigit && this.hasPwdSpecial && this.passwordsMatch;
  }

  changePasswordSubmit(): void {
    if (!this.isNewPasswordValid) {
      this.pwdError.set('La nueva contraseña debe cumplir todos los requisitos y coincidir.');
      return;
    }
    this.pwdLoading.set(true);
    this.pwdSuccess.set(null);
    this.pwdError.set(null);

    this.auth.changePassword(this.currentPassword, this.newPassword, this.confirmPassword).subscribe({
      next: (res) => {
        this.pwdLoading.set(false);
        this.pwdSuccess.set(res.detail || 'Contraseña cambiada exitosamente.');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err: Error) => {
        this.pwdLoading.set(false);
        this.pwdError.set(err.message || 'Error al cambiar la contraseña.');
      }
    });
  }

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
