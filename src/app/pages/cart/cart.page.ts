import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  COUPON_CODE,
  COUPON_RATE,
  SHIPPING_HOME,
  STORES,
} from '../../core/figma-data';
import { CatalogStore } from '../../core/services/catalog-store.service';

type Delivery = 'home' | 'pickup';
type Stage = 'cart' | 'processing' | 'done';

/**
 * CU10 / CU11 — Carrito y checkout con imágenes, cupón FASHION10 y entrega.
 * Reproduce `design/figma-make/src/web/screens/CartPage.tsx` y `CheckoutPage.tsx`.
 */
@Component({
  selector: 'app-cart-page',
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './cart.page.html',
  styleUrl: './cart.page.scss',
})
export class CartPage {
  readonly store = inject(CatalogStore);
  readonly stores = STORES;

  readonly couponCode = COUPON_CODE;
  readonly shippingHome = SHIPPING_HOME;
  readonly delivery = signal<Delivery>('home');
  readonly storeId = signal('centro');
  readonly stage = signal<Stage>('cart');
  readonly couponApplied = signal(false);
  readonly orderId = signal(this.newOrderId());

  coupon = '';

  readonly cartCount = this.store.cartCount;
  readonly subtotal = this.store.subtotal;
  readonly shipping = computed(() =>
    this.delivery() === 'home' ? SHIPPING_HOME : 0
  );
  readonly discount = computed(() =>
    this.couponApplied() ? this.subtotal() * COUPON_RATE : 0
  );
  readonly total = computed(
    () => this.subtotal() + this.shipping() - this.discount()
  );

  applyCoupon(): void {
    if (this.coupon.trim().toUpperCase() === COUPON_CODE) {
      this.couponApplied.set(true);
      this.store.showToast('Cupón FASHION10 aplicado (-10%)');
    } else {
      this.store.showToast('Cupón inválido. Prueba con FASHION10');
    }
  }

  setDelivery(mode: Delivery): void {
    this.delivery.set(mode);
  }

  setStore(id: string): void {
    this.storeId.set(id);
  }

  inc(productId: number, size: string): void {
    this.store.inc(productId, size);
  }

  dec(productId: number, size: string): void {
    this.store.dec(productId, size);
  }

  remove(productId: number, size: string): void {
    this.store.remove(productId, size);
  }

  /** Checkout simulado (el backend real se integra por `CommerceService`). */
  checkout(): void {
    if (this.cartCount() === 0) return;
    this.stage.set('processing');
    setTimeout(() => {
      this.store.clearCart();
      this.couponApplied.set(false);
      this.coupon = '';
      this.orderId.set(this.newOrderId());
      this.stage.set('done');
    }, 2200);
  }

  reset(): void {
    this.stage.set('cart');
  }

  private newOrderId(): string {
    return `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  }
}
