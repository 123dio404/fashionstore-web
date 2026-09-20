import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ui-spinner',
  template: `
    <span
      class="spinner"
      role="status"
      aria-label="Cargando"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.borderWidth.px]="size >= 24 ? 3 : 2"
    ></span>
  `
})
export class UiSpinnerComponent {
  @Input() size = 18;
}
