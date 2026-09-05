import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true, imports: [CommonModule, ReactiveFormsModule],
  template: `<main class="profile"><a href="/" class="brand">FashionStore</a><h1>Mi perfil</h1>
    <p class="message" *ngIf="message">{{ message }}</p><form [formGroup]="form" (ngSubmit)="save()">
      <label>Nombre<input formControlName="full_name"></label><label>Correo<input type="email" formControlName="email"></label>
      <label>Nueva contraseña<input type="password" formControlName="password" placeholder="Opcional"></label>
      <button class="primary-button" [disabled]="form.invalid || saving">{{ saving ? 'Guardando…' : 'Guardar cambios' }}</button>
    </form><button class="logout" (click)="logout()">Cerrar sesión</button></main>`,
  styles: [`.profile{max-width:560px;margin:60px auto;padding:0 24px;color:#1d2925}.brand{font:700 1.4rem Georgia,serif;color:inherit;text-decoration:none}.profile h1{font:400 3rem Georgia,serif;margin:64px 0 28px}form{display:grid;gap:18px}label{display:grid;gap:6px;font-weight:700;font-size:.85rem}input{padding:12px;border:1px solid #c8d0c9;font:inherit}.primary-button{border:0;background:#1d2925;color:#fff;padding:13px;margin-top:5px}.logout{margin-top:28px;background:none;border:0;color:#bb5a3c;font-weight:700}.message{padding:10px;background:#e5eee5}`]
})
export class ProfilePage {
  private readonly auth = inject(AuthService); private readonly fb = inject(FormBuilder); saving = false; message = '';
  readonly form = this.fb.nonNullable.group({ full_name: ['', Validators.required], email: ['', [Validators.required, Validators.email]], password: [''] });
  constructor() { const u = this.auth.currentUser(); if (u) this.form.patchValue({ full_name: u.full_name, email: u.email }); else this.auth.getCurrentUser().subscribe(u => this.form.patchValue({ full_name: u.full_name, email: u.email })); }
  save(): void { if (this.form.invalid) return; this.saving = true; const value = this.form.getRawValue(); this.auth.updateProfile({ ...value, password: value.password || undefined }).subscribe({ next: () => { this.message = 'Perfil actualizado.'; this.saving = false; }, error: () => { this.message = 'No se pudo actualizar el perfil.'; this.saving = false; } }); }
  logout(): void { this.auth.logout(); location.href = '/'; }
}
