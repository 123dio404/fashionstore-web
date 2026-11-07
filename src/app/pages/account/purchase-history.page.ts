import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  FigmaPurchase,
  PRODUCTS,
} from '../../core/figma-data';
import { CatalogStore } from '../../core/services/catalog-store.service';
import { CommerceService } from '../../core/services/commerce.service';
import { PaymentStatus, SaleResponse } from '../../models';

type Status = FigmaPurchase['status'];

const STATUS_LABEL: Record<Status, string> = {
  entregado: 'Entregado',
  en_camino: 'En camino',
  procesando: 'Procesando',
  cancelado: 'Cancelado',
};

const STATUS_TONE: Record<Status, string> = {
  entregado: 'ok',
  en_camino: 'info',
  procesando: 'neutral',
  cancelado: 'danger',
};

const PAYMENT_LABEL: Record<string, string> = {
  completado: 'Pagado',
  pendiente: 'Por pagar',
  fallido: 'Fallido',
  reembolsado: 'Reembolsado',
};

const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

const STEPS = ['Procesando', 'En camino', 'Entregado'];

/**
 * CU16 — Historial de compras del cliente con imágenes y detalle por orden.
 *
 * Carga las ventas reales del usuario desde `GET /commerce/sales` (CU11) y, si la
 * API no responde, cae a los datos demo de `design/figma-make/src/web/screens/PurchasesPage.tsx`.
 */
@Component({
  selector: 'app-purchase-history-page',
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './purchase-history.page.html',
  styleUrl: './purchase-history.page.scss',
})
export class PurchaseHistoryPage {
  private readonly commerce = inject(CommerceService);
  private readonly catalog = inject(CatalogStore);

  readonly purchases = signal<FigmaPurchase[]>([]);
  readonly expanded = signal<string | null>(null);
  readonly steps = STEPS;

  readonly totalSpent = computed(() =>
    this.purchases()
      .filter((purchase) => purchase.status !== 'cancelado')
      .reduce((sum, purchase) => sum + purchase.total, 0)
  );

  readonly totalItems = computed(() =>
    this.purchases().reduce(
      (sum, purchase) => sum + purchase.items.reduce((qty, item) => qty + item.qty, 0),
      0
    )
  );

  constructor() {
    void this.loadPurchases();
  }

  /** CU16 — reemplaza los datos demo por las compras reales del backend. */
  private async loadPurchases(): Promise<void> {
    try {
      const sales = await firstValueFrom(this.commerce.listSales());
      if (sales.length > 0) {
        const purchases = sales.map((sale) => this.toPurchase(sale));
        this.purchases.set(purchases);
        this.expanded.set(purchases[0]?.id ?? null);
      } else {
        this.purchases.set([]);
        this.expanded.set(null);
      }
    } catch {
      this.purchases.set([]);
      this.expanded.set(null);
    }
  }

  /** Traduce una venta del backend al formato que pinta la pantalla. */
  private toPurchase(sale: SaleResponse): FigmaPurchase {
    const payment = sale.payments.at(-1);
    return {
      id: `ORD-${sale.id}`,
      date: this.formatDate(sale.sale_date),
      status: this.statusOf(sale),
      total: Number(sale.total),
      subtotal: Number(sale.total),
      shipping: 0,
      paymentMethod: payment
        ? `${PAYMENT_LABEL[payment.status] ?? 'Pago'} · ${payment.reference ?? `#${sale.id}`}`
        : 'Pago',
      deliveryMethod: 'home',
      items: sale.items.map((item) => {
        const matched = this.catalog.products().find(
          (p) =>
            (item.product_name && p.name.trim().toLowerCase() === item.product_name.trim().toLowerCase()) ||
            (item.product_id && p.id === item.product_id)
        );
        return {
          productId: Number(item.product_id ?? 0),
          name: item.product_name ?? `Artículo #${item.stock_id}`,
          brand: item.brand ?? matched?.brand ?? 'Mundo Medias',
          price: Number(item.unit_price),
          image: matched?.image || 'https://images.unsplash.com/photo-1582966772680-860e372bb558?w=600&auto=format&fit=crop&q=80',
          size: item.size ?? 'Única',
          color: item.color ?? 'Negro',
          qty: item.quantity,
        };
      }),
    };
  }

  private statusOf(sale: SaleResponse): Status {
    if (sale.delivery_status === 'ENTREGADO_CONFORME') return 'entregado';
    if (sale.delivery_status === 'ENVIADO') return 'en_camino';
    if (sale.delivery_status === 'POR_DESPACHAR') return 'procesando';
    const status = sale.payments.at(-1)?.status;
    if (status === PaymentStatus.Fallido || status === PaymentStatus.Reembolsado) {
      return 'cancelado';
    }
    return 'procesando';
  }

  confirmDelivery(orderCode: string): void {
    const saleId = parseInt(orderCode.replace(/\D/g, ''), 10);
    if (!saleId) return;
    this.commerce.confirmCustomerDelivery(saleId, 'Cliente confirma recepción conforme del pedido').subscribe({
      next: () => {
        alert('¡Entrega confirmada conforme! Gracias por verificar la recepción.');
        void this.loadPurchases();
      },
      error: (err: any) => alert('Error al confirmar recepción: ' + (err.error?.detail || err.message))
    });
  }

  /** `2026-09-21T10:00:00Z` → `21 sep 2026`. */
  private formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }

  toggle(id: string): void {
    this.expanded.update((current) => (current === id ? null : id));
  }

  isOpen(id: string): boolean {
    return this.expanded() === id;
  }

  statusLabel(status: Status): string {
    return STATUS_LABEL[status];
  }

  statusTone(status: Status): string {
    return STATUS_TONE[status];
  }

  /** Cantidad total de prendas de una orden. */
  units(purchase: FigmaPurchase): number {
    return purchase.items.reduce((sum, item) => sum + item.qty, 0);
  }

  /** Progreso del envío (0 cancelado · 1 procesando · 2 en camino · 3 entregado). */
  progress(status: Status): number {
    switch (status) {
      case 'procesando':
        return 1;
      case 'en_camino':
        return 2;
      case 'entregado':
        return 3;
      default:
        return 0;
    }
  }

  deliveryLabel(purchase: FigmaPurchase): string {
    return purchase.deliveryMethod === 'home'
      ? `Domicilio · ${purchase.paymentMethod}`
      : `Retiro en ${purchase.store ?? 'tienda'} · ${purchase.paymentMethod}`;
  }
}
