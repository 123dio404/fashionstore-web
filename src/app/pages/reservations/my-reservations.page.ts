import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  DEMO_DATES,
  FigmaProduct,
  PRODUCTS,
  STORES,
  TIME_SLOTS,
} from '../../core/figma-data';
import { CatalogStore } from '../../core/services/catalog-store.service';
import { inject } from '@angular/core';

interface DemoReservation {
  id: string;
  productId: number;
  size: string;
  color: string;
  date: string;
  time: string;
  storeId: string;
  status: 'confirmada' | 'pendiente' | 'cancelada';
  code: string;
}

const INITIAL: DemoReservation[] = [
  {
    id: 'RES-7842',
    productId: 1,
    size: 'M',
    color: 'Negro',
    date: '24 sep 2026',
    time: '15:30',
    storeId: 'centro',
    status: 'confirmada',
    code: 'FS-7842',
  },
  {
    id: 'RES-7901',
    productId: 5,
    size: '40',
    color: 'Blanco',
    date: '28 sep 2026',
    time: '11:00',
    storeId: 'norte',
    status: 'pendiente',
    code: 'FS-7901',
  },
  {
    id: 'RES-7650',
    productId: 2,
    size: 'S',
    color: 'Terracota',
    date: '10 sep 2026',
    time: '14:00',
    storeId: 'sur',
    status: 'cancelada',
    code: 'FS-7650',
  },
];

const STATUS_MAP: Record<string, { label: string; tone: string }> = {
  confirmada: { label: 'Confirmada', tone: 'ok' },
  pendiente: { label: 'Pendiente', tone: 'warn' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
};

/**
 * CU15 — Reservas de probador del cliente con imágenes del catálogo demo.
 * Reproduce `design/figma-make/src/web/screens/ReservationsPage.tsx`.
 */
@Component({
  selector: 'app-my-reservations-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './my-reservations.page.html',
  styleUrl: './my-reservations.page.scss',
})
export class MyReservationsPage {
  private readonly store = inject(CatalogStore);

  readonly products = PRODUCTS;
  readonly stores = STORES;
  readonly slots = TIME_SLOTS;
  readonly dates = DEMO_DATES;

  readonly reservations = signal<DemoReservation[]>([...INITIAL]);
  readonly filter = signal<string>('all');
  readonly showModal = signal(false);
  readonly created = signal(false);

  productId = PRODUCTS[0].id;
  storeId = STORES[0].id;
  date = '25 sep 2026';
  time = TIME_SLOTS[0];
  size = 'M';

  get displayed(): DemoReservation[] {
    const value = this.filter();
    return value === 'all'
      ? this.reservations()
      : this.reservations().filter((item) => item.status === value);
  }

  product(id: number): FigmaProduct | undefined {
    return this.products.find((item) => item.id === id);
  }

  storeName(id: string): string {
    return this.stores.find((item) => item.id === id)?.name ?? 'Sucursal';
  }

  statusLabel(status: string): string {
    return STATUS_MAP[status]?.label ?? status;
  }

  statusTone(status: string): string {
    return STATUS_MAP[status]?.tone ?? 'neutral';
  }

  filterCount(): number {
    return this.reservations().length;
  }

  openModal(): void {
    this.created.set(false);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  confirm(): void {
    const product = this.product(Number(this.productId));
    if (!product) return;

    const stamp = Date.now();
    this.reservations.update((list) => [
      {
        id: `RES-${stamp % 100000}`,
        productId: product.id,
        size: this.size || product.sizes[0],
        color: product.colors[0]?.name ?? '',
        date: this.date,
        time: this.time,
        storeId: this.storeId,
        status: 'confirmada',
        code: `FS-${1000 + (stamp % 9000)}`,
      },
      ...list,
    ]);
    this.created.set(true);
    this.store.showToast(`Reserva confirmada · ${product.name}`);
  }

  cancel(id: string): void {
    this.reservations.update((list) =>
      list.map((item) =>
        item.id === id ? { ...item, status: 'cancelada' as const } : item
      )
    );
    this.store.showToast('Reserva cancelada');
  }
}
