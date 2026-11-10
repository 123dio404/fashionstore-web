import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { BranchesService } from '../../core/services/branches.service';
import { CommerceService } from '../../core/services/commerce.service';
import { IndexedDbService } from '../../core/services/indexed-db.service';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { ProductsService } from '../../core/services/products.service';
import { SyncManagerService } from '../../core/services/sync-manager.service';
import {
  BranchResponse,
  ReceiptResponse,
  ReservationResponse,
  SaleResponse,
  SizeResponse,
  StockResponse
} from '../../models';

/** Datos de una variante que necesita la caja (código escaneable, nombre y precio). */
interface VariantInfo {
  codigo: string;
  productName: string;
  price: number;
  sizeId: number | null;
}

/**
 * CU12 — Registrar venta presencial en caja (POS, web).
 * Flujo real: apertura de caja (carga el stock de la sucursal) → armado de la venta por código o
 * desde el stock → cobro → comprobante emitido por el backend.
 */
@Component({
  selector: 'app-pos-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './pos.page.html',
  styleUrl: './pos.page.scss'
})
export class PosPage {
  private readonly branchesService = inject(BranchesService);
  private readonly inventory = inject(InventoryService);
  private readonly commerce = inject(CommerceService);
  private readonly products = inject(ProductsService);
  private readonly auth = inject(AuthService);
  private readonly notifs = inject(NotificationsService);
  readonly syncManager = inject(SyncManagerService);
  private readonly db = inject(IndexedDbService);

  readonly branches = signal<BranchResponse[]>([]);
  readonly sizes = signal<SizeResponse[]>([]);
  private readonly variants = signal<Map<number, VariantInfo>>(new Map());
  /** Índice stock_id → variant_id para poder describir cada línea y el comprobante. */
  private readonly stockIndex = signal<Map<number, number>>(new Map());
  private readonly stocks = signal<StockResponse[]>([]);

  readonly lines = signal<Array<{ stock_id: number; quantity: number }>>([]);
  readonly branchId = signal<number | null>(null);
  readonly sessionOpen = signal(false);
  readonly sale = signal<SaleResponse | null>(null);
  readonly receipt = signal<ReceiptResponse | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly scan = signal('');
  readonly cashReceived = signal('');
  readonly paymentMethod = signal('efectivo');
  readonly qrCodeBase64 = signal<string | null>(null);
  readonly loadingQr = signal(false);

  // ── PUNTO 1: ARQUEO Y CIERRE DE CAJA ──
  readonly initialCashAmount = signal<number>(100);
  readonly sessionCashSales = signal<number>(0);
  readonly sessionCardSales = signal<number>(0);
  readonly sessionQrSales = signal<number>(0);
  readonly sessionSalesCount = signal<number>(0);
  readonly showArqueoModal = signal<boolean>(false);
  readonly countedCash = signal<number | null>(null);
  readonly arqueoSummary = signal<{
    initial: number;
    cashSales: number;
    cardSales: number;
    qrSales: number;
    totalSales: number;
    salesCount: number;
    expected: number;
    counted: number;
    diff: number;
    status: string;
    closedAt: string;
    branchName: string;
    cashier: string;
  } | null>(null);

  // ── PUNTO 2: FACTURACIÓN SIMULADA (NIT/CI Y RAZÓN SOCIAL) ──
  readonly posTaxId = signal<string>('');
  readonly posBusinessName = signal<string>('');

  // ── PUNTO 4: RESERVAS DE HOY EN SUCURSAL ──
  readonly activeTab = signal<'pos' | 'reservations'>('pos');
  readonly branchReservations = signal<ReservationResponse[]>([]);
  readonly loadingReservations = signal<boolean>(false);
  readonly convertingReservationId = signal<number | null>(null);

  readonly expectedCashInDrawer = computed(
    () => this.initialCashAmount() + this.sessionCashSales()
  );

  readonly cashVariance = computed(() => {
    const counted = this.countedCash() ?? this.expectedCashInDrawer();
    return counted - this.expectedCashInDrawer();
  });

  private defaultClientId(): number {
    const user = this.auth.currentUser();
    if (user && user.role === 'Cliente') return user.id;
    const tenantId = user?.tenant_id;
    if (tenantId === 1) return 10;
    if (tenantId === 2) return 13;
    if (tenantId === 3) return 16;
    return 4;
  }

  clientId = this.defaultClientId();

  readonly tenantName = computed(() => this.auth.currentUser()?.tenant_name ?? null);
  readonly planName = computed(() => this.auth.currentUser()?.plan_name ?? null);

  readonly branchName = computed(
    () => this.branches().find((branch) => branch.id === this.branchId())?.name ?? '—'
  );

  readonly availableVariants = computed(() =>
    this.stocks().filter((stock) => stock.available_stock > 0)
  );

  readonly totalUnits = computed(() =>
    this.lines().reduce((total, line) => total + line.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this.lines().reduce((total, line) => total + this.lineTotal(line), 0)
  );

  readonly canSubmit = computed(
    () => this.lines().length > 0 && this.clientId > 0 && this.branchId() !== null
  );

  /** Vuelto a entregar: solo aplica en pagos en efectivo, se calcula en el cliente. */
  readonly receivedCash = computed(() => Number(this.cashReceived()) || 0);

  readonly cashChange = computed(() => {
    if (this.paymentMethod() !== 'efectivo') return 0;
    return Math.max(0, this.receivedCash() - this.subtotal());
  });

  /** Cobro habilitado: en efectivo, el efectivo recibido debe cubrir el total (vacío = pago exacto). */
  readonly canPay = computed(() => {
    if (!this.canSubmit() || this.submitting()) return false;
    if (this.paymentMethod() !== 'efectivo') return true;
    return this.receivedCash() === 0 || this.receivedCash() >= this.subtotal();
  });

  constructor() {
    this.branchesService.list().subscribe({
      next: (items) => {
        this.branches.set(items);
        this.restoreActiveSession();
        // Si no hay sesión previa guardada, preseleccionar la primera sucursal disponible
        if (!this.branchId() && items.length > 0) {
          const userBranch = (this.auth.currentUser() as any)?.branch_id;
          const found = items.find((b) => b.id === userBranch) || items[0];
          this.branchId.set(found.id);
        }
      },
      error: () => {
        void this.loadCachedBranches();
        this.restoreActiveSession();
      }
    });
    this.products.listSizes().subscribe({
      next: (items) => this.sizes.set(items),
      error: () => undefined
    });
    // Catálogo completo: permite buscar por código de barras/SKU y conocer el precio de cada variante.
    this.products.list().subscribe({
      next: (items) => this.indexCatalog(items),
      error: () => void this.loadCachedCatalog()
    });
  }

  private get sessionKey(): string {
    const tenantId = this.auth.currentUser()?.tenant_id || 'default';
    return `fs_pos_session_${tenantId}`;
  }

  /** Persiste el turno de caja en localStorage para no perderlo al cambiar de pestaña */
  private persistSession(): void {
    const bId = this.branchId();
    if (!this.sessionOpen() || !bId) return;
    try {
      const data = {
        branchId: bId,
        initialCash: this.initialCashAmount(),
        cashSales: this.sessionCashSales(),
        cardSales: this.sessionCardSales(),
        qrSales: this.sessionQrSales(),
        salesCount: this.sessionSalesCount(),
        openedAt: new Date().toISOString()
      };
      localStorage.setItem(this.sessionKey, JSON.stringify(data));
    } catch {
      // LocalStorage protegido
    }
  }

  /** Restaura la caja abierta previamente si el cajero navegó a otra pantalla */
  private restoreActiveSession(): void {
    try {
      const raw = localStorage.getItem(this.sessionKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && data.branchId) {
        this.branchId.set(data.branchId);
        this.initialCashAmount.set(data.initialCash ?? 100);
        this.sessionCashSales.set(data.cashSales ?? 0);
        this.sessionCardSales.set(data.cardSales ?? 0);
        this.sessionQrSales.set(data.qrSales ?? 0);
        this.sessionSalesCount.set(data.salesCount ?? 0);
        this.sessionOpen.set(true);

        if (this.syncManager.isOnline()) {
          this.refreshStock(data.branchId);
          this.loadBranchReservations();
        } else {
          void this.openSessionFromCache(data.branchId);
        }
      }
    } catch {
      // ignore
    }
  }

  /** Limpia la sesión local al cerrar turno y completar arqueo */
  private clearActiveSession(): void {
    try {
      localStorage.removeItem(this.sessionKey);
    } catch {
      // ignore
    }
  }

  /** CU-09/CU-10: la caja puede abrirse y vender con la copia local de IndexedDB. */
  private async loadCachedBranches(): Promise<void> {
    try {
      const branches = await this.db.getBranches();
      if (branches.length) this.branches.set(branches);
    } catch {
      // Sin caché local: el usuario verá el error al abrir caja.
    }
  }

  private async loadCachedCatalog(): Promise<void> {
    try {
      const products = await this.db.getCatalog();
      if (products.length) this.indexCatalog(products);
    } catch {
      this.error.set('No hay catálogo local disponible para operar sin conexión.');
    }
  }

  private indexCatalog(items: Array<{ name: string; price: number; variants: Array<{ id: number; codigo: string; size_id: number | null; price: number | null }> }>): void {
    const map = new Map<number, VariantInfo>();
    for (const product of items) {
      for (const variant of product.variants) {
        map.set(variant.id, {
          codigo: variant.codigo,
          productName: product.name,
          price: Number(variant.price ?? product.price),
          sizeId: variant.size_id
        });
      }
    }
    this.variants.set(map);
  }

  /** Información de la variante detrás de una línea de la caja o de un ítem del comprobante. */
  variantOf(stockId: number): VariantInfo | undefined {
    const variantId = this.stockIndex().get(stockId);
    return variantId === undefined ? undefined : this.variants().get(variantId);
  }

  sizeName(sizeId: number | null | undefined): string {
    if (sizeId === null || sizeId === undefined) return '—';
    return this.sizes().find((size) => size.id === sizeId)?.name ?? '—';
  }

  lineTotal(line: { stock_id: number; quantity: number }): number {
    const price = this.variantOf(line.stock_id)?.price ?? 0;
    return price * line.quantity;
  }

  changeQuantity(index: number, quantity: number): void {
    const line = this.lines()[index];
    if (!line) return;
    const stock = this.stocks().find((row) => row.id === line.stock_id);
    const max = stock?.available_stock ?? 1;
    const value = Math.min(Math.max(1, Number(quantity) || 1), Math.max(1, max));
    this.lines.set(this.lines().map((item, i) => (i === index ? { ...item, quantity: value } : item)));
    if (this.paymentMethod() === 'qr') {
      this.generateQr();
    }
  }

  removeLine(index: number): void {
    this.lines.set(this.lines().filter((_, i) => i !== index));
    if (this.paymentMethod() === 'qr') {
      this.generateQr();
    }
  }

  setPaymentMethod(method: string): void {
    this.paymentMethod.set(method);
    if (method === 'qr' && !this.qrCodeBase64()) {
      this.generateQr();
    }
  }

  generateQr(): void {
    if (this.subtotal() <= 0) return;
    this.loadingQr.set(true);
    this.commerce
      .createQrPayment({
        amount: this.subtotal(),
        currency: 'usd',
        description: `Cobro POS ${this.tenantName() || 'FashionStore'} - ${this.branchName()}`
      })
      .subscribe({
        next: (res) => {
          this.qrCodeBase64.set(res.qr_code_base64);
          this.loadingQr.set(false);
        },
        error: () => {
          this.loadingQr.set(false);
        }
      });
  }

  /** Apertura de caja: habilita la terminal y carga el stock de la sucursal. */
  openSession(): void {
    const branchId = this.branchId();
    if (!branchId) return;
    this.error.set(null);
    this.sessionCashSales.set(0);
    this.sessionCardSales.set(0);
    this.sessionQrSales.set(0);
    this.sessionSalesCount.set(0);
    this.arqueoSummary.set(null);
    this.sessionOpen.set(true);
    this.persistSession();

    if (!this.syncManager.isOnline()) {
      void this.openSessionFromCache(branchId);
      return;
    }

    this.inventory.listStock(branchId).subscribe({
      next: (rows) => {
        this.applyStock(rows);
        this.sessionOpen.set(true);
        this.message.set('Caja abierta. Stock de la sucursal cargado.');
        this.loadBranchReservations();
        this.persistSession();

        // Consulta si ya hubo ventas previas hoy en esta sucursal para incorporarlas al turno
        this.commerce.listSales().subscribe({
          next: (allSales) => {
            const today = new Date().toISOString().slice(0, 10);
            const todayBranchSales = allSales.filter(
              (s) => s.branch_id === branchId && s.sale_date && s.sale_date.startsWith(today)
            );
            if (todayBranchSales.length > 0 && this.sessionSalesCount() === 0) {
              let cash = 0, card = 0, qr = 0;
              for (const s of todayBranchSales) {
                const tot = Number(s.total) || 0;
                const pm = ((s.payments?.[0] as any)?.payment_method || (s.payments?.[0] as any)?.reference || '').toLowerCase();
                if (pm.includes('cash') || pm.includes('efectivo')) cash += tot;
                else if (pm.includes('card') || pm.includes('tarjeta')) card += tot;
                else qr += tot;
              }
              this.sessionCashSales.set(cash);
              this.sessionCardSales.set(card);
              this.sessionQrSales.set(qr);
              this.sessionSalesCount.set(todayBranchSales.length);
              this.persistSession();
            }
          },
          error: () => undefined
        });
      },
      error: () => void this.openSessionFromCache(branchId)
    });
  }

  /** CU-09: apertura de caja sin red usando las existencias guardadas en IndexedDB. */
  private async openSessionFromCache(branchId: number): Promise<void> {
    try {
      if (this.variants().size === 0) {
        await this.loadCachedCatalog();
      }
      const rows = (await this.db.getInventory()).filter(
        (row) => row.branch_id === branchId
      );
      if (rows.length === 0) {
        this.error.set(
          'No hay existencias guardadas para esta sucursal. Abre la caja con conexión al menos una vez.'
        );
        return;
      }
      this.applyStock(rows);
      this.sessionOpen.set(true);
      this.message.set(
        'Caja abierta en modo offline con las existencias guardadas en el dispositivo.'
      );
      this.loadBranchReservations();
    } catch {
      this.error.set('No se pudo abrir la caja sin conexión: no hay datos locales.');
    }
  }

  openArqueoModal(): void {
    this.countedCash.set(this.expectedCashInDrawer());
    this.showArqueoModal.set(true);
  }

  cancelArqueo(): void {
    this.showArqueoModal.set(false);
  }

  confirmArqueo(): void {
    const counted = this.countedCash() ?? this.expectedCashInDrawer();
    const expected = this.expectedCashInDrawer();
    const diff = Number((counted - expected).toFixed(2));
    let statusText = 'Cuadrado exacto (Sin diferencias)';
    if (diff > 0) statusText = `Sobrante en gaveta (+Bs. ${diff.toFixed(2)})`;
    if (diff < 0) statusText = `Faltante en gaveta (-Bs. ${Math.abs(diff).toFixed(2)})`;

    this.arqueoSummary.set({
      initial: this.initialCashAmount(),
      cashSales: this.sessionCashSales(),
      cardSales: this.sessionCardSales(),
      qrSales: this.sessionQrSales(),
      totalSales: this.sessionCashSales() + this.sessionCardSales() + this.sessionQrSales(),
      salesCount: this.sessionSalesCount(),
      expected,
      counted,
      diff,
      status: statusText,
      closedAt: new Date().toLocaleString(),
      branchName: this.branchName(),
      cashier: this.auth.currentUser()?.full_name || 'Cajero de Turno'
    });

    const bId = this.branchId();
    if (bId) {
      this.commerce.cashClose({
        branch_id: bId,
        initial_amount: this.initialCashAmount(),
        cash_sales: this.sessionCashSales(),
        card_sales: this.sessionCardSales(),
        qr_sales: this.sessionQrSales(),
        total_sales: this.sessionCashSales() + this.sessionCardSales() + this.sessionQrSales(),
        sales_count: this.sessionSalesCount(),
        counted_amount: counted,
        difference: diff,
        status_text: statusText
      }).subscribe({
        next: () => {
          this.notifs.fetchFromBackend();
        },
        error: (err) => console.warn('Error al registrar cierre de caja en backend:', err)
      });
    }

    this.clearActiveSession();
    this.showArqueoModal.set(false);
    this.sessionOpen.set(false);
    this.lines.set([]);
    this.sale.set(null);
    this.receipt.set(null);
    this.message.set('Turno de caja cerrado exitosamente. Comprobante de arqueo emitido.');
  }

  dismissArqueoSummary(): void {
    this.arqueoSummary.set(null);
  }

  loadBranchReservations(): void {
    const bId = this.branchId();
    if (!bId) return;
    this.loadingReservations.set(true);
    this.commerce.listReservations({ branchId: bId }).subscribe({
      next: (list) => {
        const activeStatuses = new Set([
          'pendiente',
          'confirmada',
          'preparacion',
          'lista',
          'en_probador',
          'checkout',
          'en_tienda'
        ]);
        this.branchReservations.set(list.filter((r) => activeStatuses.has(r.status)));
        this.loadingReservations.set(false);
      },
      error: () => this.loadingReservations.set(false)
    });
  }

  convertReservation(resId: number): void {
    this.convertingReservationId.set(resId);
    this.commerce.completeReservation(resId).subscribe({
      next: (sale) => {
        this.convertingReservationId.set(null);
        const totalVal = Number(sale.total);
        this.sessionCashSales.update((v) => v + totalVal);
        this.sessionSalesCount.update((v) => v + 1);
        this.message.set(`¡Reserva #${resId} cobrada con éxito! Venta #${sale.id} generada.`);
        this.sale.set(sale);
        this.loadReceipt(sale.id);
        const bId = this.branchId();
        if (bId) {
          this.refreshStock(bId);
          this.loadBranchReservations();
        }
        this.notifs.fetchFromBackend();
        this.activeTab.set('pos');
      },
      error: (err: any) => {
        this.convertingReservationId.set(null);
        this.error.set(err?.error?.detail || err?.message || 'Error al cobrar reserva.');
      }
    });
  }

  closeSession(): void {
    this.openArqueoModal();
  }

  /** Añade una línea buscando la variante por su código (lector de barras o SKU). */
  scanAdd(): void {
    const code = this.scan().trim().toLowerCase();
    if (!code) return;

    const match = [...this.variants().entries()].find(
      ([, info]) => info.codigo.toLowerCase() === code
    );
    if (!match) {
      this.error.set(`No existe una variante con el código "${this.scan().trim()}".`);
      return;
    }

    const stock = this.stocks().find(
      (row) => row.variant_id === match[0] && row.available_stock > 0
    );
    if (!stock) {
      this.error.set('La variante existe, pero no tiene stock disponible en esta sucursal.');
      return;
    }

    this.error.set(null);
    this.addLine(stock.id, 1);
    this.scan.set('');
  }

  /** Permite añadir directamente un stock desde el selector visual del POS */
  addStockItem(stockId: number | string): void {
    const id = Number(stockId);
    if (!id) return;
    this.addLine(id, 1);
    this.error.set(null);
  }

  addLine(stockId: number, quantity: number): void {
    const existing = this.lines().find((line) => line.stock_id === stockId);
    if (existing) {
      const index = this.lines().indexOf(existing);
      this.changeQuantity(index, existing.quantity + quantity);
      return;
    }
    this.lines.set([...this.lines(), { stock_id: stockId, quantity }]);
    if (this.paymentMethod() === 'qr') {
      this.generateQr();
    }
  }

  submit(): void {
    const branchId = this.branchId();
    if (!branchId || !this.canSubmit()) return;

    this.submitting.set(true);
    this.error.set(null);

    // CU-12/CU-13: sin red la venta se encola en IndexedDB y se sincroniza después.
    if (!this.syncManager.isOnline()) {
      void this.queueOfflineSale(branchId);
      return;
    }

    this.commerce
      .posSale({
        branch_id: branchId,
        client_id: this.clientId,
        items: this.lines(),
        paid: true,
        payment_provider: this.paymentMethod() === 'efectivo' ? 'cash' : (this.paymentMethod() === 'qr' ? 'qr' : this.paymentMethod()),
        tax_id: this.posTaxId().trim() || undefined,
        business_name: this.posBusinessName().trim() || undefined
      })
      .subscribe({
        next: (sale) => {
          this.submitting.set(false);
          this.sale.set(sale);
          const totalVal = Number(sale.total);
          if (this.paymentMethod() === 'efectivo') {
            this.sessionCashSales.update((v) => v + totalVal);
          } else if (this.paymentMethod() === 'tarjeta') {
            this.sessionCardSales.update((v) => v + totalVal);
          } else {
            this.sessionQrSales.update((v) => v + totalVal);
          }
          this.sessionSalesCount.update((v) => v + 1);
          this.persistSession();
          this.lines.set([]);
          this.message.set('Venta POS registrada.');
          this.loadReceipt(sale.id);
          this.refreshStock(branchId);
          this.notifs.fetchFromBackend();
        },
        error: (err: any) => {
          // status 0 = fallo de red: se conserva la venta como operación local.
          if (!err?.status) {
            this.syncManager.setOnline(false);
            void this.queueOfflineSale(branchId);
            return;
          }
          this.submitting.set(false);
          this.error.set(err?.error?.detail || err?.message || 'No se pudo registrar la venta.');
        }
      });
  }

  /** Guarda la venta en la cola offline con el contrato que espera `POST /sync/batch`. */
  private async queueOfflineSale(branchId: number): Promise<void> {
    try {
      const items = this.lines().map((line) => ({
        stock_id: line.stock_id,
        quantity: line.quantity,
        unit_price: this.variantOf(line.stock_id)?.price ?? 0
      }));
      const total = items.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      );

      const queued = await this.syncManager.recordOfflineSale({
        branch_id: branchId,
        client_id: this.clientId || undefined,
        payment_method: this.paymentMethod(),
        items,
        total
      });

      // Sumar al arqueo de caja local de turno
      if (this.paymentMethod() === 'efectivo') {
        this.sessionCashSales.update((v) => v + total);
      } else if (this.paymentMethod() === 'tarjeta') {
        this.sessionCardSales.update((v) => v + total);
      } else {
        this.sessionQrSales.update((v) => v + total);
      }
      this.sessionSalesCount.update((v) => v + 1);
      this.persistSession();

      // Descontar inmediatamente existencias locales para que el cajero vea el stock actualizado
      for (const line of items) {
        this.stocks.update((list) =>
          list.map((st) =>
            st.id === line.stock_id
              ? {
                  ...st,
                  available_stock: Math.max(0, st.available_stock - line.quantity),
                  physical_stock: Math.max(0, st.physical_stock - line.quantity)
                }
              : st
          )
        );
      }
      void this.db.saveInventory(this.stocks());

      this.lines.set([]);
      this.sale.set(null);
      this.receipt.set(null);
      this.message.set(
        `Venta registrada offline (UUID ${queued.uuid}). Se sincronizará automáticamente al recuperar la conexión.`
      );
    } catch (err) {
      this.error.set(
        'No se pudo guardar la venta offline: ' +
          (err instanceof Error ? err.message : 'error desconocido')
      );
    } finally {
      this.submitting.set(false);
    }
  }

  private loadReceipt(saleId: number): void {
    this.commerce.getReceipt(saleId).subscribe({
      next: (doc) => this.receipt.set(doc),
      error: () => this.receipt.set(null)
    });
  }

  private refreshStock(branchId: number): void {
    this.inventory.listStock(branchId).subscribe({
      next: (rows) => this.applyStock(rows),
      error: () => undefined
    });
  }

  private applyStock(rows: StockResponse[]): void {
    this.stocks.set(rows);
    this.stockIndex.set(new Map(rows.map((row) => [row.id, row.variant_id])));
    void this.db.saveInventory(rows);
  }

  printReceipt(): void {
    window.print();
  }

  newSale(): void {
    this.sale.set(null);
    this.receipt.set(null);
    this.message.set(null);
    this.cashReceived.set('');
    this.qrCodeBase64.set(null);
    this.posTaxId.set('');
    this.posBusinessName.set('');
    const branchId = this.branchId();
    if (branchId) {
      this.refreshStock(branchId);
    }
  }
}
