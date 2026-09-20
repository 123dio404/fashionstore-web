import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

/** Pestañas con contador — réplica del patrón de pestañas del prototipo de Figma. */
@Component({
  selector: 'app-ui-tabs',
  template: `
    <div class="tabs" role="tablist">
      @for (tab of tabs; track tab.id) {
        <button
          type="button"
          class="tab"
          role="tab"
          [class.active]="tab.id === active"
          [attr.aria-selected]="tab.id === active"
          (click)="activeChange.emit(tab.id)"
        >
          {{ tab.label }}
          @if (tab.count !== undefined) {
            <span class="tab-count">{{ tab.count }}</span>
          }
        </button>
      }
    </div>
  `
})
export class UiTabsComponent {
  @Input() tabs: TabItem[] = [];
  @Input() active = '';
  @Output() activeChange = new EventEmitter<string>();
}
