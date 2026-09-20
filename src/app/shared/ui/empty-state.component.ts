import { Component, Input } from '@angular/core';

/** Figma — Estado «Empty»: sin resultados o sin datos. */
@Component({
  selector: 'app-ui-empty',
  template: `
    <div class="state">
      <div class="state-icon" aria-hidden="true">{{ icon }}</div>
      <h3 class="state-title">{{ title }}</h3>
      @if (message) {
        <p class="state-message">{{ message }}</p>
      }
      <ng-content />
    </div>
  `
})
export class UiEmptyComponent {
  @Input() icon = '🗂️';
  @Input() title = 'Sin resultados';
  @Input() message = '';
}
