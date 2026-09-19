import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { Role } from './models';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly auth = inject(AuthService);
  readonly user = this.auth.currentUser;

  readonly isStaff = computed(() => {
    const role = this.user()?.role;
    return role === Role.Administrador || role === Role.Encargado || role === Role.Cajero;
  });
  readonly isManager = computed(() => {
    const role = this.user()?.role;
    return role === Role.Administrador || role === Role.Encargado;
  });
  readonly isAdmin = computed(() => this.user()?.role === Role.Administrador);

  constructor() {
    this.auth.restoreSession().subscribe();
  }

  logout(): void {
    this.auth.logout();
  }
}

