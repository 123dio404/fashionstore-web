import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Figma — Estado «Error»: validación, red o servicio. */
@Component({
  selector: 'app-ui-error',
  template: `
    <div class="state state-danger">
      <div class="state-icon" aria-hidden="true">⚠️</div>
      <h3 class="state-title">{{ title }}</h3>
      @if (message) {
        <p class="state-message">{{ message }}</p>
      }
      @if (retryable) {
        <button class="btn-primary" type="button" (click)="retry.emit()">Reintentar</button>
      }
    </div>
  `
})
export class UiErrorComponent {
  @Input() title = 'Algo salió mal';
  @Input() message = '';
  @Input() retryable = true;
  @Output() retry = new EventEmitter<void>();
}
