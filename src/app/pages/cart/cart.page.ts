import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  COUPON_CODE,
  COUPON_RATE,
  SHIPPING_HOME,
  STORES,
} from '../../core/figma-data';
import {
  BranchResponse,
  InvoiceResponse,
  PaymentStatus,
  ProductResponse,
} from '../../models';
import { BranchesService } from '../../core/services/branches.service';
import { CatalogStore } from '../../core/services/catalog-store.service';
import { CommerceService } from '../../core/services/commerce.service';
import { ProductsService } from '../../core/services/products.service';

type Delivery = 'home' | 'pickup';
type Stage = 'cart' | 'processing' | 'done';

/**
 * CU10 / CU11 — Carrito y checkout con imágenes, cupón FASHION10 y entrega.
 *
 * El checkout es **real**: resuelve la sucursal y el stock en la API, arma el carrito
 * del backend, cobra con la pasarela simulada (`payment_provider: 'simulado'`) y emite
 * la factura del documento fiscal simulado, que se puede descargar en PDF.
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

  private readonly commerce = inject(CommerceService);
  private readonly products = inject(ProductsService);
  private readonly branches = inject(BranchesService);

  readonly couponCode = COUPON_CODE;
  readonly shippingHome = SHIPPING_HOME;
  readonly delivery = signal<Delivery>('home');
  readonly storeId = signal('centro');
  readonly stage = signal<Stage>('cart');
  readonly couponApplied = signal(false);
  readonly orderId = signal('');

  /** CU11 — resultado real del checkout: venta, referencia del pago y factura. */
  readonly saleId = signal<number | null>(null);
  readonly paymentReference = signal<string | null>(null);
  readonly invoice = signal<InvoiceResponse | null>(null);
  readonly progress = signal('');
  readonly warnings = signal<string[]>([]);

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

  /**
   * CU11 — checkout real contra la API.
   *
   * Resuelve la sucursal y el stock de verdad, arma el carrito del backend, cobra con
   * la pasarela **simulada** y emite la factura del documento fiscal simulado. Si una
   * prenda de demostración no existe en el catálogo del servidor, se avisa y la venta
   * continúa con el resto.
   */
  async checkout(): Promise<void> {
    if (this.cartCount() === 0 || this.stage() === 'processing') return;
    this.stage.set('processing');
    this.warnings.set([]);
    this.paymentReference.set(null);
    this.invoice.set(null);

    try {
      this.progress.set('Ubicando la sucursal…');
      const branch = await this.resolveBranch();

      this.progress.set('Leyendo el catálogo…');
      const products = await firstValueFrom(this.products.list());
      const missing = await this.pushCartToServer(products, branch.id);

      this.progress.set('Cobrando con la pasarela simulada…');
      const sale = await firstValueFrom(
        this.commerce.checkout({
          branch_id: branch.id,
          payment_provider: 'simulado',
          payment_status: PaymentStatus.Completado,
        })
      );
      this.saleId.set(sale.id);
      this.paymentReference.set(
        sale.payments.length > 0 ? sale.payments[sale.payments.length - 1].reference : null
      );

      this.progress.set('Emitiendo la factura…');
      this.invoice.set(await firstValueFrom(this.commerce.getInvoice(sale.id)));

      this.orderId.set(`ORD-${sale.id}`);
      this.warnings.set(missing);
      this.store.clearCart();
      this.couponApplied.set(false);
      this.coupon = '';
      this.stage.set('done');
      this.store.showToast(`Venta #${sale.id} registrada por ${sale.total}`);
    } catch (error) {
      this.fail(this.describe(error));
    }
  }

  /** Sucursal real de la API que corresponde a la tienda elegida en la pantalla. */
  private async resolveBranch(): Promise<BranchResponse> {
    const branches = await firstValueFrom(this.branches.list());
    if (branches.length === 0) {
      throw new Error('El sistema no tiene sucursales configuradas.');
    }
    const wanted = this.storeId().toLowerCase();
    return branches.find((branch) => branch.name.toLowerCase().includes(wanted)) ?? branches[0];
  }

  /** Agrega cada prenda del carrito local al carrito del backend. Devuelve las omitidas. */
  private async pushCartToServer(
    products: ProductResponse[],
    branchId: number
  ): Promise<string[]> {
    const missing: string[] = [];
    for (const item of this.store.cart()) {
      this.progress.set(`Reservando stock: ${item.name}…`);
      const product = products.find(
        (candidate) => candidate.name.trim().toLowerCase() === item.name.trim().toLowerCase()
      );
      if (!product) {
        missing.push(`${item.name} (no está en el catálogo del servidor)`);
        continue;
      }
      const rows = await firstValueFrom(this.products.availability(product.id, branchId));
      const free =
        rows.find((row) => row.available_stock >= item.qty) ??
        rows.find((row) => row.available_stock > 0);
      if (!free) {
        missing.push(`${item.name} (sin stock en la sucursal)`);
        continue;
      }
      await firstValueFrom(
        this.commerce.addItem({
          stock_id: free.stock_id,
          quantity: Math.min(item.qty, free.available_stock),
        })
      );
    }
    return missing;
  }

  /** Descarga la factura PDF del documento fiscal simulado. */
  downloadInvoice(): void {
    const id = this.saleId();
    if (id === null) return;
    this.commerce.invoicePdf(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.invoice()?.invoice_number ?? `FAC-${id}`}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.store.showToast('No se pudo descargar la factura.'),
    });
  }

  reset(): void {
    this.stage.set('cart');
  }

  /** IVA del documento fiscal en porcentaje (0.19 → '19'). */
  taxPercent(rate: string | number | null | undefined): string {
    const value = Number(rate ?? 0) * 100;
    return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
  }

  private fail(message: string): void {
    this.progress.set('');
    this.stage.set('cart');
    this.store.showToast(message);
  }

  private describe(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return 'Inicia sesión como cliente para completar la compra.';
      const detail = (error.error as { detail?: string } | null)?.detail;
      return typeof detail === 'string' ? detail : `La API respondió ${error.status}.`;
    }
    return error instanceof Error ? error.message : 'No se pudo completar la compra.';
  }
}
