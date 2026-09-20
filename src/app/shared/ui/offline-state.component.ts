import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Figma — Estado «Offline»: sin conexión, con reintento. */
@Component({
  selector: 'app-ui-offline',
  template: `
    <div class="state state-offline">
      <div class="state-icon" aria-hidden="true">📡</div>
      <h3 class="state-title">{{ title }}</h3>
      <p class="state-message">{{ message }}</p>
      <button class="btn-primary" type="button" (click)="retry.emit()">Reintentar</button>
    </div>
  `
})
export class UiOfflineComponent {
  @Input() title = 'Sin conexión';
  @Input() message = 'No pudimos contactar al servidor. Revisa tu conexión e inténtalo de nuevo.';
  @Output() retry = new EventEmitter<void>();
}
