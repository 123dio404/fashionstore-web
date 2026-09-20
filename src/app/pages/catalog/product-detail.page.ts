import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { ICONS } from '../../core/navigation';
import { AuthService } from '../../core/services/auth.service';
import { BranchesService } from '../../core/services/branches.service';
import { CommerceService } from '../../core/services/commerce.service';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductsService } from '../../core/services/products.service';
import {
  BranchResponse,
  ColorResponse,
  ProductResponse,
  SizeResponse,
  StockResponse,
  VariantResponse
} from '../../models';
import { UiErrorComponent } from '../../shared/ui/error-state.component';
import { UiIconComponent } from '../../shared/ui/icon.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';

interface BranchAvailability {
  branch_id: number;
  name: string;
  available: number;
}

/** CU08 + CU10 — Detalle de prenda con talla/color, disponibilidad por sucursal y carrito. */
@Component({
  selector: 'app-product-detail-page',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UiErrorComponent,
    UiIconComponent,
    UiSkeletonComponent
  ],
  templateUrl: './product-detail.page.html',
  styleUrl: './product-detail.page.scss'
})
export class ProductDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly products = inject(ProductsService);
  private readonly branchesService = inject(BranchesService);
  private readonly inventory = inject(InventoryService);
  private readonly commerce = inject(CommerceService);
  private readonly auth = inject(AuthService);

  readonly icons = ICONS;
  readonly product = signal<ProductResponse | null>(null);
  readonly branches = signal<BranchResponse[]>([]);
  readonly sizes = signal<SizeResponse[]>([]);
  readonly colors = signal<ColorResponse[]>([]);
  /** Stock por sucursal, ya filtrado a las variantes de esta prenda. */
  private readonly stock = signal<Record<number, StockResponse[]>>({});
  readonly loading = signal(true);
  readonly stockLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly cartError = signal<string | null>(null);
  readonly added = signal(false);

  readonly sizeId = signal<number | null>(null);
  readonly colorId = signal<number | null>(null);
  readonly branchId = signal<number | null>(null);
  readonly quantity = signal(1);

  private readonly productId = Number(this.route.snapshot.paramMap.get('id'));

  readonly sizeOptions = computed(() =>
    this.sizes().filter((size) =>
      (this.product()?.variants ?? []).some((variant) => variant.size_id === size.id)
    )
  );

  readonly colorOptions = computed(() =>
    this.colors().filter((color) =>
      (this.product()?.variants ?? []).some((variant) => variant.color_id === color.id)
    )
  );

  /** Variante que corresponde a la talla y el color elegidos. */
  readonly selectedVariant = computed<VariantResponse | undefined>(() => {
    const size = this.sizeId();
    const color = this.colorId();
    return (this.product()?.variants ?? []).find(
      (variant) =>
        (size === null || variant.size_id === size) &&
        (color === null || variant.color_id === color)
    );
  });

  /** Disponibilidad por sucursal de la variante elegida (o de toda la prenda). */
  readonly availability = computed<BranchAvailability[]>(() => {
    const map = this.stock();
    const variantId = this.selectedVariant()?.id ?? null;
    return this.branches().map((branch) => {
      const rows = map[branch.id] ?? [];
      const relevant = variantId === null ? rows : rows.filter((row) => row.variant_id === variantId);
      return {
        branch_id: branch.id,
        name: branch.name,
        available: relevant.reduce((total, row) => total + Math.max(0, row.available_stock), 0)
      };
    });
  });

  constructor() {
    this.load();
    this.products.listSizes().subscribe((items) => this.sizes.set(items));
    this.products.listColors().subscribe((items) => this.colors.set(items));
    this.branchesService.list().subscribe((items) => {
      this.branches.set(items);
      if (items.length > 0 && this.branchId() === null) {
        this.branchId.set(items[0].id);
      }
      this.loadAvailability();
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.products.get(this.productId).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
        this.loadAvailability();
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  /** Consulta el stock de cada sucursal para las variantes de esta prenda. */
  private loadAvailability(): void {
    const branches = this.branches();
    const variantIds = new Set((this.product()?.variants ?? []).map((variant) => variant.id));
    if (branches.length === 0 || variantIds.size === 0) {
      return;
    }

    this.stockLoading.set(true);
    forkJoin(
      branches.map((branch) =>
        this.inventory.listStock(branch.id).pipe(catchError(() => of([] as StockResponse[])))
      )
    ).subscribe({
      next: (results) => {
        const map: Record<number, StockResponse[]> = {};
        branches.forEach((branch, index) => {
          map[branch.id] = (results[index] ?? []).filter((row) => variantIds.has(row.variant_id));
        });
        this.stock.set(map);
        this.stockLoading.set(false);
      },
      error: () => this.stockLoading.set(false)
    });
  }

  /** Fila de stock de la variante y sucursal elegidas (es lo que se agrega al carrito). */
  private stockForSelection(): StockResponse | undefined {
    const variantId = this.selectedVariant()?.id;
    const branchId = this.branchId();
    if (variantId === undefined || branchId === null) {
      return undefined;
    }
    return (this.stock()[branchId] ?? []).find((row) => row.variant_id === variantId);
  }

  hasVariant(sizeId: number | null, colorId: number | null): boolean {
    return (this.product()?.variants ?? []).some(
      (variant) =>
        (sizeId === null || variant.size_id === sizeId) &&
        (colorId === null || variant.color_id === colorId)
    );
  }

  canAdd(): boolean {
    return this.sizeId() !== null && (this.stockForSelection()?.available_stock ?? 0) > 0;
  }

  setQuantity(value: number): void {
    this.quantity.set(Math.max(1, value));
  }

  initial(): string {
    const product = this.product();
    if (!product) return 'FS';
    return (product.brand || product.name).charAt(0).toUpperCase();
  }

  addToCart(): void {
    this.message.set(null);
    this.cartError.set(null);

    if (!this.auth.hasToken()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const stock = this.stockForSelection();
    if (!stock) {
      this.cartError.set('Selecciona una talla disponible en la sucursal.');
      return;
    }

    this.commerce.addItem({ stock_id: stock.id, quantity: this.quantity() }).subscribe({
      next: () => {
        this.message.set('Producto agregado al carrito.');
        this.added.set(true);
        setTimeout(() => this.added.set(false), 1800);
      },
      error: (err: Error) => this.cartError.set(err.message)
    });
  }
}
