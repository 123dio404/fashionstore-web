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
