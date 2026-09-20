import { Component, EventEmitter, Input, Output } from '@angular/core';

import { UiSpinnerComponent } from './spinner.component';

export type ButtonVariant = 'primary' | 'secondary' | 'brand' | 'danger' | 'ghost' | 'neutral';
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Figma — Button: primary / secondary / brand / danger / disabled (+ estado loading). */
@Component({
  selector: 'app-ui-button',
  imports: [UiSpinnerComponent],
  template: `
    <button [class]="classes" [type]="type" [disabled]="disabled || loading" (click)="pressed.emit($event)">
      @if (loading) {
        <app-ui-spinner [size]="14" />
      }
      <ng-content />
    </button>
  `
})
export class UiButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Output() pressed = new EventEmitter<MouseEvent>();

  get classes(): string {
    const variants: Record<ButtonVariant, string> = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      brand: 'btn-brand',
      danger: 'btn-danger',
      ghost: 'btn-ghost',
      neutral: 'btn'
    };
    const sizes: Record<ButtonSize, string> = { sm: 'btn-sm', md: '', lg: 'btn-lg' };
    return [variants[this.variant], sizes[this.size]].filter(Boolean).join(' ');
  }
}
