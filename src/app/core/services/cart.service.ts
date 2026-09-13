import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { CommerceService } from './commerce.service';
import { CartItemResponse } from '../../models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly auth = inject(AuthService);
  private readonly commerce = inject(CommerceService);

  readonly count = signal(0);
  readonly items = signal<CartItemResponse[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');

  refresh(): void {
    if (!this.auth.hasToken()) {
      this.reset();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.commerce.getCart().subscribe({
      next: (cart) => {
        const qty = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        this.count.set(qty);
        this.items.set(cart.items);
        this.total.set(Number(cart.total));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el carrito.');
      }
    });
  }

  reset(): void {
    this.count.set(0);
    this.items.set([]);
    this.total.set(0);
    this.loading.set(false);
    this.error.set('');
  }
}