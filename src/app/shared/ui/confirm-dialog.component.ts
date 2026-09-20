import { Component, inject } from '@angular/core';

import { ConfirmService } from './confirm.service';

/** Modal de confirmación — se monta una sola vez en el shell. */
@Component({
  selector: 'app-ui-confirm',
  template: `
    @if (confirm.state(); as state) {
      <div class="modal-backdrop" (click)="confirm.cancel()">
        <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <h3 class="modal-title">{{ state.title }}</h3>
          <p class="modal-message">{{ state.message }}</p>
          <div class="modal-actions">
            <button class="btn" type="button" (click)="confirm.cancel()">
              {{ state.cancelLabel || 'Cancelar' }}
            </button>
            <button
              [class]="state.danger ? 'btn-danger' : 'btn-primary'"
              type="button"
              (click)="confirm.confirm()"
            >
              {{ state.confirmLabel || 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class UiConfirmComponent {
  readonly confirm = inject(ConfirmService);
}
