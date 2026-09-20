import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ui-skeleton',
  template: `
    <div class="skeleton-list" aria-busy="true" aria-live="polite">
      @for (row of items; track $index) {
        <div class="skeleton" [style.height.px]="height" [style.width]="width"></div>
      }
    </div>
  `
})
export class UiSkeletonComponent {
  @Input() rows = 3;
  @Input() height = 16;
  @Input() width = '100%';

  get items(): number[] {
    return Array.from({ length: Math.max(1, this.rows) }, (_, index) => index);
  }
}
