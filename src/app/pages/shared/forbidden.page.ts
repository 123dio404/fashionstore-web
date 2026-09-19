import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden-page',
  imports: [RouterLink],
  template: `
    <div class="card" style="max-width: 30rem; margin: 3rem auto; text-align: center">
      <h2>Acceso denegado</h2>
      <p class="muted">No tienes permisos para acceder a esta sección.</p>
      <a class="btn" routerLink="/catalog">Volver al catálogo</a>
    </div>
  `
})
export class ForbiddenPage {}
