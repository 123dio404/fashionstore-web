import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { FigmaCartItem, FigmaProduct, PRODUCTS, STORES } from '../figma-data';
import { BranchesService } from './branches.service';
import { InventoryService } from './inventory.service';
import { ProductsService } from './products.service';

/**
 * Estado del catálogo público y sincronización de inventario en tiempo real
 * entre clientes, cajeros (POS) y administradores.
 */
@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly branchesService = inject(BranchesService);
  private readonly inventoryService = inject(InventoryService);
  private readonly productsService = inject(ProductsService);

  readonly products = signal<FigmaProduct[]>(PRODUCTS);
  readonly cart = signal<FigmaCartItem[]>([]);
  readonly favs = signal<number[]>([]);
  readonly toast = signal<string | null>(null);
  readonly stockLoaded = signal(false);

  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.refreshStock();
  }

  /**
   * Consulta el stock real de todas las sucursales en la base de datos de la API
   * y actualiza el mapa de existencias para que clientes, cajeros y administradores
   * vean exactamente el mismo inventario disponible.
   */
  refreshStock(): void {
    forkJoin({
      branches: this.branchesService.list(),
      apiProducts: this.productsService.list(),
      stocks: this.inventoryService.listStock(),
    }).subscribe({
      next: ({ branches, apiProducts, stocks }) => {
        this.products.update((current) =>
          current.map((p) => {
            // Emparejar producto del catálogo con el del servidor
            const apiProd = apiProducts.find(
              (ap) =>
                ap.name.trim().toLowerCase() === p.name.trim().toLowerCase() ||
                ap.id === p.id
            );
            if (!apiProd) return p;

            const variantIds = new Set(apiProd.variants.map((v) => v.id));
            const newStockMap: Record<string, number> = { ...p.stock };

            for (const branch of branches) {
              const bKey =
                branch.name.replace(/^Sucursal\s+/i, '').trim();
              // Suma del stock disponible de las variantes de este producto en esta sucursal
              const branchTotal = stocks
                .filter(
                  (s) =>
                    s.branch_id === branch.id && variantIds.has(s.variant_id)
                )
                .reduce((sum, s) => sum + Math.max(0, s.available_stock), 0);

              newStockMap[bKey] = branchTotal;
              // También normalizar con la primera letra mayúscula (ej. 'Centro', 'Norte', 'Sur')
              const capitalized = bKey.charAt(0).toUpperCase() + bKey.slice(1).toLowerCase();
              newStockMap[capitalized] = branchTotal;
            }

            return {
              ...p,
              stock: newStockMap,
            };
          })
        );
        this.stockLoaded.set(true);
      },
      error: () => {
        // En caso de estar offline o error de red, mantiene los valores precargados
        this.stockLoaded.set(true);
      },
    });
  }

  readonly cartCount = computed(() =>
    this.cart().reduce((sum, item) => sum + item.qty, 0)
  );

  readonly subtotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.price * item.qty, 0)
  );

  readonly favCount = computed(() => this.favs().length);

  byId(id: number): FigmaProduct | undefined {
    return this.products().find((product) => product.id === id);
  }

  featured(): FigmaProduct[] {
    return this.products().filter((product) => product.isFeatured);
  }

  byCategory(category: string): FigmaProduct[] {
    if (category === 'Todas') return this.products();
    if (category === 'Ofertas') {
      return this.products().filter((product) => product.discount >= 25);
    }
    return this.products().filter((product) => product.category === category);
  }

  add(product: FigmaProduct, size?: string, color?: string): void {
    const pickedSize = size ?? product.sizes[0] ?? 'M';
    const pickedColor = color ?? product.colors[0]?.name ?? '';
    const existing = this.cart().find(
      (item) => item.productId === product.id && item.size === pickedSize
    );

    if (existing) {
      this.cart.update((items) =>
        items.map((item) =>
          item.productId === product.id && item.size === pickedSize
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      );
    } else {
      this.cart.update((items) => [
        ...items,
        {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          image: product.image,
          size: pickedSize,
          color: pickedColor,
          qty: 1,
        },
      ]);
    }
    this.showToast(`${product.name} añadido al carrito`);
  }

  inc(productId: number, size: string): void {
    this.cart.update((items) =>
      items.map((item) =>
        item.productId === productId && item.size === size
          ? { ...item, qty: item.qty + 1 }
          : item
      )
    );
  }

  dec(productId: number, size: string): void {
    this.cart.update((items) =>
      items.map((item) =>
        item.productId === productId && item.size === size
          ? { ...item, qty: Math.max(1, item.qty - 1) }
          : item
      )
    );
  }

  remove(productId: number, size: string): void {
    this.cart.update((items) =>
      items.filter(
        (item) => !(item.productId === productId && item.size === size)
      )
    );
  }

  clearCart(): void {
    this.cart.set([]);
  }

  isFav(id: number): boolean {
    return this.favs().includes(id);
  }

  toggleFav(id: number): void {
    this.favs.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }

  showToast(message: string): void {
    this.toast.set(message);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 2500);
  }
}
