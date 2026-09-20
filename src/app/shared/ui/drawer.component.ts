import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

/**
 * Panel lateral para altas y ediciones — réplica del patrón de *drawer* del prototipo de Figma.
 * Se cierra con la X, con clic en el fondo o con la tecla Esc.
 */
@Component({
  selector: 'app-ui-drawer',
  template: `
    @if (open) {
      <div class="drawer-backdrop" (click)="close()"></div>
      <aside class="drawer" [style.width.px]="width" role="dialog" aria-modal="true">
        <header class="drawer-head">
          <div>
            <h3 class="drawer-title">{{ title }}</h3>
            @if (subtitle) {
              <p class="drawer-sub">{{ subtitle }}</p>
            }
          </div>
          <button type="button" class="drawer-close" (click)="close()" aria-label="Cerrar">×</button>
        </header>

        <div class="drawer-body">
          <ng-content />
        </div>

        <footer class="drawer-foot">
          <ng-content select="[drawer-actions]" />
        </footer>
      </aside>
    }
  `
})
export class UiDrawerComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() width = 420;
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.closed.emit();
    }
  }

  close(): void {
    this.closed.emit();
  }
}
