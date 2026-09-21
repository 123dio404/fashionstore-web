import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FigmaPurchase, INITIAL_PURCHASES } from '../../core/figma-data';

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

const STEPS = ['Procesando', 'En camino', 'Entregado'];

/**
 * CU16 — Historial de compras del cliente con imágenes y detalle por orden.
 * Reproduce `design/figma-make/src/web/screens/PurchasesPage.tsx`.
 */
@Component({
  selector: 'app-purchase-history-page',
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './purchase-history.page.html',
  styleUrl: './purchase-history.page.scss',
})
export class PurchaseHistoryPage {
  readonly purchases = signal<FigmaPurchase[]>(INITIAL_PURCHASES);
  readonly expanded = signal<string | null>(INITIAL_PURCHASES[0]?.id ?? null);
  readonly steps = STEPS;

  readonly totalSpent = INITIAL_PURCHASES.filter(
    (purchase) => purchase.status !== 'cancelado'
  ).reduce((sum, purchase) => sum + purchase.total, 0);

  readonly totalItems = INITIAL_PURCHASES.reduce(
    (sum, purchase) =>
      sum + purchase.items.reduce((qty, item) => qty + item.qty, 0),
    0
  );

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
