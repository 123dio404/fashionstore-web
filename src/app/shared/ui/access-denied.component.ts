import { Component, Input } from '@angular/core';

/** Figma — «Access denied»: permisos por rol. */
@Component({
  selector: 'app-ui-access-denied',
  template: `
    <div class="state state-danger">
      <div class="state-icon" aria-hidden="true">🔒</div>
      <h3 class="state-title">{{ title }}</h3>
      <p class="state-message">{{ message }}</p>
      <ng-content />
    </div>
  `
})
export class UiAccessDeniedComponent {
  @Input() title = 'Acceso denegado';
  @Input() message = 'No tienes permisos para acceder a esta sección.';
}
