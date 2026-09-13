import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container page text-center">
      <div class="empty" style="max-width:420px;margin:60px auto">
        <div class="empty-icon">🔒</div>
        <h3>Acceso restringido</h3>
        <p>No tienes permisos para ver esta página.</p>
        <a class="btn btn-primary mt-1" routerLink="/">Volver al inicio</a>
      </div>
    </div>
  `
})
export class ForbiddenPage {}