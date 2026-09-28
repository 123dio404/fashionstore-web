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
export type PaymentMethod = 'card' | 'qr' | 'cash';
export type CardId = 'visa' | 'mc';

/**
 * CU10 / CU11 — Carrito y checkout con imágenes, cupón FASHION10, entrega
 * y pasarela de pago Stripe (Tarjeta, QR dinámico y Efectivo).
 *
 * El checkout es real: resuelve la sucursal y el stock en la API, arma el carrito
 * del backend, cobra con la pasarela Stripe (aprobación Visa / rechazo Mastercard 402 / QR)
 * o efectivo, emite la factura del documento fiscal simulado y permite descargarla en PDF.
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

  // Métodos de pago (Pasarela Stripe, QR y Efectivo)
  readonly paymentMethod = signal<PaymentMethod>('card');
  readonly cardId = signal<CardId>('visa');
  readonly qrCodeBase64 = signal<string | null>(null);
  readonly qrPaymentUrl = signal<string | null>(null);
  readonly loadingQr = signal(false);
  readonly paymentError = signal<string | null>(null);
  readonly selectedPaymentLabel = signal<string>('Tarjeta Visa (Stripe)');

  readonly cards = [
    {
      id: 'visa' as const,
      label: 'Visa •••• 4242',
      token: 'pm_card_visa',
      simulateRejection: false,
      badge: 'Aprobación',
      badgeClass: 'badge-success',
      color: '#1a1f71',
    },
    {
      id: 'mc' as const,
      label: 'Mastercard •••• 0002',
      token: 'pm_card_declined',
      simulateRejection: true,
      badge: 'Simular Rechazo (402)',
      badgeClass: 'badge-danger',
      color: '#eb001b',
    },
  ];

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

  readonly checkoutButtonLabel = computed(() => {
    const tot = this.total();
    const formatted = `$${tot.toFixed(2)}`;
    if (this.paymentMethod() === 'card') {
      const isRejection = this.cardId() === 'mc';
      return isRejection
        ? `Probar Rechazo Stripe (${formatted})`
        : `Pagar con Tarjeta Stripe (${formatted})`;
    }
    if (this.paymentMethod() === 'qr') {
      return `Confirmar Pago QR Stripe (${formatted})`;
    }
    return `Confirmar Pedido en Efectivo (${formatted})`;
  });

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
    if (this.paymentMethod() === 'qr') {
      this.loadQrPayment();
    }
  }

  setStore(id: string): void {
    this.storeId.set(id);
  }

  setPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod.set(method);
    this.paymentError.set(null);
    if (method === 'qr' && !this.qrCodeBase64()) {
      this.loadQrPayment();
    }
  }

  setCardId(id: CardId): void {
    this.cardId.set(id);
    this.paymentError.set(null);
  }

  async loadQrPayment(): Promise<void> {
    if (this.loadingQr()) return;
    this.loadingQr.set(true);
    this.paymentError.set(null);
    try {
      const res = await firstValueFrom(
        this.commerce.createQrPayment({
          amount: this.total(),
          currency: 'usd',
          description: 'Pago FashionStore Web',
        })
      );
      this.qrCodeBase64.set(res.qr_code_base64);
      this.qrPaymentUrl.set(res.payment_url);
    } catch {
      this.store.showToast('No se pudo generar el código QR de Stripe.');
    } finally {
      this.loadingQr.set(false);
    }
  }

  inc(productId: number, size: string): void {
    this.store.inc(productId, size);
    if (this.paymentMethod() === 'qr') {
      this.loadQrPayment();
    }
  }

  dec(productId: number, size: string): void {
    this.store.dec(productId, size);
    if (this.paymentMethod() === 'qr') {
      this.loadQrPayment();
    }
  }

  remove(productId: number, size: string): void {
    this.store.remove(productId, size);
    if (this.paymentMethod() === 'qr') {
      this.loadQrPayment();
    }
  }

  /**
   * CU11 — checkout real contra la pasarela Stripe y la API.
   *
   * Valida stock en la sucursal, cobra mediante Stripe (Tarjeta / QR) o efectivo,
   * maneja rechazos (402) sin vaciar el carrito y emite la factura del documento fiscal.
   */
  async checkout(): Promise<void> {
    if (this.cartCount() === 0 || this.stage() === 'processing') return;
    this.stage.set('processing');
    this.warnings.set([]);
    this.paymentReference.set(null);
    this.invoice.set(null);
    this.paymentError.set(null);

    const isCard = this.paymentMethod() === 'card';
    const isQr = this.paymentMethod() === 'qr';
    const isCash = this.paymentMethod() === 'cash';

    const provider = isCash ? 'efectivo' : (isQr ? 'stripe_qr' : 'stripe');
    const selectedCard = this.cards.find((c) => c.id === this.cardId()) ?? this.cards[0];
    const cardToken = isCard ? selectedCard.token : null;
    const simulateRejection = isCard && selectedCard.simulateRejection;

    const methodDesc = isCash
      ? 'Efectivo en tienda / contra entrega'
      : isQr
      ? 'Stripe QR'
      : selectedCard.label;
    this.selectedPaymentLabel.set(methodDesc);

    try {
      this.progress.set('Ubicando la sucursal…');
      const branch = await this.resolveBranch();

      this.progress.set('Leyendo el catálogo…');
      const products = await firstValueFrom(this.products.list());
      const missing = await this.pushCartToServer(products, branch.id);

      this.progress.set(
        isCash
          ? 'Registrando pedido en efectivo…'
          : isQr
          ? 'Validando cobro con Stripe QR…'
          : simulateRejection
          ? 'Validando con pasarela Stripe (rechazo 402 simulado)…'
          : 'Validando cobro con tarjeta Stripe…'
      );

      const sale = await firstValueFrom(
        this.commerce.checkout({
          branch_id: branch.id,
          payment_provider: provider,
          payment_status: PaymentStatus.Completado,
          card_token: cardToken,
          simulate_rejection: simulateRejection,
        })
      );
      this.saleId.set(sale.id);
      this.paymentReference.set(
        sale.payments.length > 0 ? sale.payments[sale.payments.length - 1].reference : null
      );

      this.progress.set('Emitiendo factura fiscal simulada…');
      this.invoice.set(await firstValueFrom(this.commerce.getInvoice(sale.id)));

      this.orderId.set(`ORD-${sale.id}`);
      this.warnings.set(missing);
      this.store.clearCart();
      this.couponApplied.set(false);
      this.coupon = '';
      this.stage.set('done');
      this.store.showToast(`Venta #${sale.id} registrada exitosamente.`);
    } catch (error) {
      const msg = this.describe(error);
      this.paymentError.set(msg);
      this.fail(msg);
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
