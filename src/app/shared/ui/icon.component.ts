import { Component, Input } from '@angular/core';

/**
 * Icono de línea — réplica del componente `Ic` del diseño web de Figma
 * (`design/figma-make/web/src/web/WebLayout.tsx`): trazo 1.8, sin relleno,
 * puntas y uniones redondeadas, 24×24.
 */
@Component({
  selector: 'app-ui-icon',
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      [attr.fill]="fill"
      [attr.stroke]="color"
      [attr.stroke-width]="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @for (path of paths; track $index) {
        <path [attr.d]="path" />
      }
    </svg>
  `,
  styles: [
    ':host { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }',
  ],
})
export class UiIconComponent {
  /** Uno o varios `d` de SVG (mismo formato que el array de paths de Figma). */
  @Input({ required: true }) set d(value: string | string[]) {
    this.paths = Array.isArray(value) ? value : [value];
  }

  paths: string[] = [];

  @Input() size = 18;
  @Input() color = 'currentColor';
  @Input() strokeWidth = 1.8;
  @Input() fill = 'none';
}
