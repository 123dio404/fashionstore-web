import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  DEMO_DATES,
  FigmaProduct,
  PRODUCTS,
  STORES,
  TIME_SLOTS,
} from '../../core/figma-data';
import { BranchesService } from '../../core/services/branches.service';
import { CatalogStore } from '../../core/services/catalog-store.service';
import { CommerceService } from '../../core/services/commerce.service';
import { IndexedDbService } from '../../core/services/indexed-db.service';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { ProductsService } from '../../core/services/products.service';
import { SyncManagerService } from '../../core/services/sync-manager.service';
import {
  BranchResponse,
  ProductResponse,
  ReservationCreate,
  SizeResponse,
  StockResponse,
  VariantResponse
} from '../../models';

interface DemoReservation {
  id: string;
  /** ID real de la reserva cuando se creó en el backend. */
  serverId?: number;
  /** UUID local cuando la reserva quedó en la cola offline. */
  uuid?: string;
  productId: number;
  size: string;
  color: string;
  date: string;
  time: string;
  storeId: string;
  status: 'confirmada' | 'pendiente' | 'cancelada';
  code: string;
}

const INITIAL: DemoReservation[] = [];

const STATUS_MAP: Record<string, { label: string; tone: string }> = {
  confirmada: { label: 'Confirmada', tone: 'ok' },
  pendiente: { label: 'Pendiente', tone: 'warn' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
};

/** Meses abreviados del prototipo (`25 sep 2026`) → fecha ISO para el backend. */
const MONTHS: Record<string, string> = {
  ene: '01',
  feb: '02',
  mar: '03',
  abr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  ago: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dic: '12'
};

/**
 * CU15 — Reservas de probador del cliente con imágenes del catálogo demo.
 * Reproduce `design/figma-make/src/web/screens/ReservationsPage.tsx`.
 *
 * CU-15 (flujo real): la reserva se crea contra el backend resolviendo la
 * prenda demo → producto/variante/stock reales. Sin conexión se guarda en la
 * cola offline con su UUID para sincronizarse después (CU-13).
 */
@Component({
  selector: 'app-my-reservations-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './my-reservations.page.html',
  styleUrl: './my-reservations.page.scss',
})
export class MyReservationsPage {
  private readonly store = inject(CatalogStore);
  private readonly notifs = inject(NotificationsService);
  private readonly commerce = inject(CommerceService);
  private readonly branchesService = inject(BranchesService);
  private readonly productsService = inject(ProductsService);
  private readonly inventoryService = inject(InventoryService);
  private readonly sync = inject(SyncManagerService);
  private readonly db = inject(IndexedDbService);

  get products(): FigmaProduct[] {
    const list = this.store.products();
    return list.length > 0 ? list : PRODUCTS;
  }

  get stores(): Array<{ id: string; name: string }> {
    const list = this.branches();
    return list.length > 0 ? list.map((b) => ({ id: String(b.id), name: b.name })) : STORES;
  }

  readonly slots = TIME_SLOTS;
  readonly dates = DEMO_DATES;

  readonly reservations = signal<DemoReservation[]>([]);
  readonly filter = signal<string>('all');
  readonly showModal = signal(false);
  readonly created = signal(false);
  readonly createdOffline = signal(false);
  readonly saving = signal(false);

  readonly branches = signal<BranchResponse[]>([]);
  private readonly apiProducts = signal<ProductResponse[]>([]);
  private readonly sizes = signal<SizeResponse[]>([]);
  private readonly stocks = signal<StockResponse[]>([]);

  productId = 1;
  storeId = '1';
  date = '25 sep 2026';
  time = TIME_SLOTS[0];
  size = 'M';

  constructor() {
    this.branchesService.list().subscribe({
      next: (items) => {
        this.branches.set(items);
        if (items.length > 0) {
          this.storeId = String(items[0].id);
        }
      },
      error: () => void this.loadCachedBranches()
    });
    this.productsService.list().subscribe({
      next: (items) => {
        this.apiProducts.set(items);
        if (items.length > 0) {
          this.productId = items[0].id;
        }
      },
      error: () => void this.loadCachedCatalog()
    });
    this.productsService.listSizes().subscribe({
      next: (items) => this.sizes.set(items),
      error: () => void this.loadCachedSizes()
    });
    this.inventoryService.listStock().subscribe({
      next: (rows) => this.stocks.set(rows),
      error: () => void this.loadCachedInventory()
    });
    void this.sync.refreshQueue();
    this.loadReservations();
  }

  private loadReservations(): void {
    this.commerce.listReservations().subscribe({
      next: (items) => {
        const mapped: DemoReservation[] = items.map((res) => {
          const matched = this.store.products().find((p) => p.id === res.items[0]?.stock_id || p.id === Number(res.id));
          return {
            id: `RES-${res.id}`,
            serverId: Number(res.id),
            productId: matched?.id ?? (this.products[0]?.id ?? 1),
            size: 'Única',
            color: 'Negro',
            date: res.reservation_date,
            time: res.reservation_time,
            storeId: String(res.branch_id),
            status: this.mapStatus(res.status),
            code: `FS-${res.id}`,
          };
        });
        this.reservations.set(mapped);
      },
      error: () => {
        this.reservations.set([]);
      }
    });
  }

  private mapStatus(status: string): 'confirmada' | 'pendiente' | 'cancelada' {
    const s = String(status).toLowerCase();
    if (s.includes('confirm') || s.includes('list') || s.includes('prepar') || s.includes('asign')) return 'confirmada';
    if (s.includes('cancel')) return 'cancelada';
    return 'pendiente';
  }

  private async loadCachedBranches(): Promise<void> {
    try {
      this.branches.set(await this.db.getBranches());
    } catch {
      // Sin caché local: se mantiene la selección demo.
    }
  }

  private async loadCachedCatalog(): Promise<void> {
    try {
      this.apiProducts.set(await this.db.getCatalog());
    } catch {
      // Sin caché local: no se podrá crear una reserva real.
    }
  }

  private async loadCachedSizes(): Promise<void> {
    try {
      this.sizes.set(await this.db.getSizes());
    } catch {
      // Sin caché local de tallas.
    }
  }

  private async loadCachedInventory(): Promise<void> {
    try {
      this.stocks.set(await this.db.getInventory());
    } catch {
      // Sin caché local de inventario.
    }
  }

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
    const match = this.branches().find((b) => String(b.id) === String(id));
    if (match) return match.name;
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
    this.createdOffline.set(false);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  confirm(): void {
    const product = this.product(Number(this.productId));
    if (!product || this.saving()) return;

    const pickedSize = this.size || product.sizes[0];
    const branch = this.resolveBranch();
    const apiProduct = this.resolveApiProduct(product);
    const variant = apiProduct
      ? this.resolveVariant(apiProduct, pickedSize)
      : undefined;

    if (!branch || !apiProduct || !variant) {
      this.store.showToast(
        'No se pudo vincular la prenda con el catálogo del servidor. Verifica la conexión.'
      );
      return;
    }

    const stock = this.resolveStock(variant.id, branch.id);
    if (!stock) {
      this.store.showToast(
        `No hay stock de la talla ${pickedSize} en ${branch.name}.`
      );
      return;
    }

    const payload: ReservationCreate = {
      branch_id: branch.id,
      reservation_date: this.toIsoDate(this.date),
      reservation_time: this.toIsoTime(this.time),
      items: [{ stock_id: stock.id, quantity: 1 }]
    };
    const unitPrice = Number(variant.price ?? apiProduct.price ?? 0);

    this.saving.set(true);
    if (!this.sync.isOnline()) {
      void this.queueOfflineReservation(payload, unitPrice);
      return;
    }

    this.commerce.createReservation(payload).subscribe({
      next: (reservation) => {
        this.saving.set(false);
        this.pushReservation(false, reservation.id);
      },
      error: (err: any) => {
        // status 0 = fallo de red: la reserva queda pendiente de sincronizar.
        if (!err?.status) {
          void this.queueOfflineReservation(payload, unitPrice);
          return;
        }
        this.saving.set(false);
        this.store.showToast(
          err?.error?.detail || 'No se pudo crear la reserva en el servidor.'
        );
      }
    });
  }

  private async queueOfflineReservation(
    payload: ReservationCreate,
    unitPrice: number
  ): Promise<void> {
    try {
      const item = await this.sync.recordOfflineReservation({
        branch_id: payload.branch_id,
        created_at: `${payload.reservation_date}T${payload.reservation_time}`,
        items: [
          {
            stock_id: payload.items[0].stock_id,
            quantity: payload.items[0].quantity,
            unit_price: unitPrice
          }
        ]
      });
      this.pushReservation(true, undefined, item.uuid);
    } catch (err) {
      this.notifs.error(
        'No se pudo guardar la reserva offline: ' +
          (err instanceof Error ? err.message : 'error desconocido')
      );
    } finally {
      this.saving.set(false);
    }
  }

  /** Agrega la reserva a la vista local (confirmada online o pendiente offline). */
  private pushReservation(
    offline: boolean,
    serverId?: number,
    uuid?: string
  ): void {
    const product = this.product(Number(this.productId));
    if (!product) return;

    const stamp = Date.now();
    const pickedSize = this.size || product.sizes[0];
    const branchName = this.storeName(this.storeId);
    const id = serverId ? `RES-${serverId}` : `LOC-${stamp % 100000}`;
    const code = serverId ? `FS-${1000 + (serverId % 9000)}` : `FS-${1000 + (stamp % 9000)}`;

    this.reservations.update((list) => [
      {
        id,
        serverId,
        uuid,
        productId: product.id,
        size: pickedSize,
        color: product.colors[0]?.name ?? '',
        date: this.date,
        time: this.time,
        storeId: this.storeId,
        status: offline ? 'pendiente' : 'confirmada',
        code,
      },
      ...list,
    ]);

    this.created.set(true);
    this.createdOffline.set(offline);

    this.notifs.addNotification({
      title: offline
        ? 'Reserva guardada sin conexión'
        : 'Reserva de probador confirmada',
      message: offline
        ? `Reserva para "${product.name}" (Talla ${pickedSize}) en ${branchName}: se sincronizará al recuperar la conexión.`
        : `Cita reservada para "${product.name}" (Talla ${pickedSize}) en ${branchName} el ${this.date} a las ${this.time}.`,
      type: 'reservation',
      link: '/my-reservations',
    });

    this.store.showToast(
      offline ? 'Reserva guardada para sincronizar' : 'Reserva confirmada'
    );
  }

  cancel(id: string): void {
    const target = this.reservations().find((item) => item.id === id);
    this.reservations.update((list) =>
      list.map((item) =>
        item.id === id ? { ...item, status: 'cancelada' as const } : item
      )
    );

    if (target?.serverId) {
      this.commerce.cancelReservation(target.serverId).subscribe({
        next: () => this.store.showToast('Reserva cancelada'),
        error: () => {
          // Se revierte el cambio local si el backend rechazó la cancelación.
          this.reservations.update((list) =>
            list.map((item) =>
              item.id === id ? { ...item, status: 'confirmada' as const } : item
            )
          );
          this.notifs.error('No se pudo cancelar la reserva en el servidor.');
        }
      });
      return;
    }

    this.store.showToast('Reserva cancelada');
  }

  // ── RESOLUCIÓN DEMO → BACKEND ──

  private resolveBranch(): BranchResponse | undefined {
    const demo = this.stores.find((item) => item.id === this.storeId);
    if (!demo) return this.branches()[0];

    const normalize = (value: string) =>
      value.replace(/^sucursal\s+/i, '').trim().toLowerCase();

    return (
      this.branches().find(
        (branch) => branch.name.trim().toLowerCase() === demo.name.trim().toLowerCase()
      ) ??
      this.branches().find(
        (branch) => normalize(branch.name) === normalize(demo.name)
      ) ??
      this.branches()[0]
    );
  }

  private resolveApiProduct(product: FigmaProduct): ProductResponse | undefined {
    const normalize = (value: string) => value.trim().toLowerCase();
    return this.apiProducts().find(
      (item) => normalize(item.name) === normalize(product.name)
    );
  }

  private resolveVariant(
    product: ProductResponse,
    sizeName: string
  ): VariantResponse | undefined {
    const normalize = (value: string) => value.trim().toLowerCase();
    const size = this.sizes().find((item) => normalize(item.name) === normalize(sizeName));
    return (
      (size
        ? product.variants.find((variant) => variant.size_id === size.id)
        : undefined) ??
      product.variants.find(
        (variant) =>
          variant.size && normalize(variant.size.name) === normalize(sizeName)
      ) ??
      (product.variants.length === 1 ? product.variants[0] : undefined)
    );
  }

  private resolveStock(variantId: number, branchId: number): StockResponse | undefined {
    return this.stocks().find(
      (row) =>
        row.variant_id === variantId &&
        row.branch_id === branchId &&
        row.available_stock > 0
    );
  }

  private toIsoDate(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const match = value.trim().toLowerCase().match(/^(\d{1,2})\s+([a-záéíóú]{3})\s+(\d{4})$/);
    if (match) {
      const month = MONTHS[match[2]] ?? '01';
      return `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
    }
    return new Date().toISOString().slice(0, 10);
  }

  private toIsoTime(value: string): string {
    return value.length === 5 ? `${value}:00` : value;
  }
}
