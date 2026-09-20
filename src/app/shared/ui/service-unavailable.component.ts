import { Component, Input } from '@angular/core';

/** Figma — «Service not configured»: falta integración de IA, voz o pasarela. */
@Component({
  selector: 'app-ui-service-unavailable',
  template: `
    <div class="state state-service">
      <div class="state-icon" aria-hidden="true">🔌</div>
      <h3 class="state-title">{{ title }}</h3>
      <p class="state-message">{{ message }}</p>
      <p class="muted">Configura el proveedor en el backend (variables de entorno) para habilitar esta función.</p>
    </div>
  `
})
export class UiServiceUnavailableComponent {
  @Input() title = 'Servicio no configurado';
  @Input() message = 'Esta integración todavía no está habilitada.';
}
