import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.page.html'
})
export class ResetPasswordPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  token = '';
  newPassword = '';
  confirmPassword = '';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  get hasMinLength(): boolean { return this.newPassword.length >= 8; }
  get hasUpper(): boolean { return /[A-Z]/.test(this.newPassword); }
  get hasLower(): boolean { return /[a-z]/.test(this.newPassword); }
  get hasDigit(): boolean { return /[0-9]/.test(this.newPassword); }
  get hasSpecial(): boolean { return /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/~`';]/.test(this.newPassword); }
  get passwordsMatch(): boolean { return this.newPassword.length > 0 && this.newPassword === this.confirmPassword; }
  get isPasswordValid(): boolean {
    return this.hasMinLength && this.hasUpper && this.hasLower && this.hasDigit && this.hasSpecial && this.passwordsMatch;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.error.set('No se proporcionó ningún token de recuperación en el enlace.');
      }
    });
  }

  submit(): void {
    if (!this.token) {
      this.error.set('Token de recuperación no válido o ausente.');
      return;
    }
    if (!this.isPasswordValid) {
      this.error.set('La nueva contraseña debe cumplir con todos los requisitos y coincidir con la confirmación.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.auth.resetPassword(this.token, this.newPassword, this.confirmPassword).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(res.detail || '¡Contraseña restablecida con éxito!');
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.');
      }
    });
  }
}
