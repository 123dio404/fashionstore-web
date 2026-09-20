import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { BranchesService } from '../../core/services/branches.service';
import { CommerceService } from '../../core/services/commerce.service';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductsService } from '../../core/services/products.service';
import {
  BranchResponse,
  ReceiptResponse,
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

  clientId = this.auth.currentUser()?.id ?? 0;
  paymentMethod = 'efectivo';

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

  constructor() {
    this.branchesService.list().subscribe({
      next: (items) => this.branches.set(items),
      error: (err: Error) => this.error.set(err.message)
    });
    this.products.listSizes().subscribe((items) => this.sizes.set(items));
    // Catálogo completo: permite buscar por código de barras/SKU y conocer el precio de cada variante.
    this.products.list().subscribe({
      next: (items) => {
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
      },
      error: (err: Error) => this.error.set(err.message)
    });
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
  }

  removeLine(index: number): void {
    this.lines.set(this.lines().filter((_, i) => i !== index));
  }

  /** Apertura de caja: habilita la terminal y carga el stock de la sucursal. */
  openSession(): void {
    const branchId = this.branchId();
    if (!branchId) return;
    this.error.set(null);
    this.inventory.listStock(branchId).subscribe({
      next: (rows) => {
        this.applyStock(rows);
        this.sessionOpen.set(true);
        this.message.set('Caja abierta. Stock de la sucursal cargado.');
      },
      error: (err: Error) => this.error.set(err.message)
    });
  }

  closeSession(): void {
    this.sessionOpen.set(false);
    this.lines.set([]);
    this.sale.set(null);
    this.receipt.set(null);
    this.message.set('Caja cerrada en esta pantalla.');
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

  private addLine(stockId: number, quantity: number): void {
    const existing = this.lines().find((line) => line.stock_id === stockId);
    if (existing) {
      const index = this.lines().indexOf(existing);
      this.changeQuantity(index, existing.quantity + quantity);
      return;
    }
    this.lines.set([...this.lines(), { stock_id: stockId, quantity }]);
  }

  submit(): void {
    const branchId = this.branchId();
    if (!branchId || !this.canSubmit()) return;

    this.submitting.set(true);
    this.error.set(null);
    this.commerce
      .posSale({
        branch_id: branchId,
        client_id: this.clientId,
        items: this.lines(),
        paid: true,
        payment_provider: this.paymentMethod === 'efectivo' ? 'cash' : this.paymentMethod
      })
      .subscribe({
        next: (sale) => {
          this.submitting.set(false);
          this.sale.set(sale);
          this.lines.set([]);
          this.message.set('Venta POS registrada.');
          this.loadReceipt(sale.id);
          this.refreshStock(branchId);
        },
        error: (err: Error) => {
          this.submitting.set(false);
          this.error.set(err.message);
        }
      });
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
  }

  printReceipt(): void {
    window.print();
  }

  newSale(): void {
    this.sale.set(null);
    this.receipt.set(null);
    this.message.set(null);
    const branchId = this.branchId();
    if (branchId) {
      this.refreshStock(branchId);
    }
  }
}
