import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { FigmaCartItem, FigmaProduct, PRODUCTS } from '../figma-data';
import { BranchResponse, ProductResponse, SizeResponse, StockResponse } from '../../models';
import { BranchesService } from './branches.service';
import { IndexedDbService } from './indexed-db.service';
import { InventoryService } from './inventory.service';
import { ProductsService } from './products.service';

/**
 * Estado del catálogo público y sincronización de inventario en tiempo real
 * entre clientes, cajeros (POS) y administradores.
 *
 * CU-09: cada carga exitosa deja una copia del catálogo, las existencias y las
 * sucursales en IndexedDB. Si la red falla, el catálogo se reconstruye desde
 * esa copia local para que la tienda siga navegable sin conexión.
 */
@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly branchesService = inject(BranchesService);
  private readonly inventoryService = inject(InventoryService);
  private readonly productsService = inject(ProductsService);
  private readonly db = inject(IndexedDbService);

  readonly products = signal<FigmaProduct[]>(PRODUCTS);
  readonly cart = signal<FigmaCartItem[]>([]);
  readonly favs = signal<number[]>([]);
  readonly toast = signal<string | null>(null);
  readonly stockLoaded = signal(false);
  /** true cuando el mapa de stock mostrado proviene de IndexedDB (sin red). */
  readonly servedFromCache = signal(false);
  readonly lastCachedAt = signal<string | null>(null);

  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.refreshStock();
  }

  /**
   * Consulta el stock real de todas las sucursales en la base de datos de la API,
   * actualiza el mapa de existencias y guarda la instantánea en IndexedDB.
   */
  refreshStock(): void {
    forkJoin({
      branches: this.branchesService.list(),
      apiProducts: this.productsService.list(),
      stocks: this.inventoryService.listStock(),
      sizes: this.productsService.listSizes(),
    }).subscribe({
      next: ({ branches, apiProducts, stocks, sizes }) => {
        this.applySnapshot(branches, apiProducts, stocks);
        this.servedFromCache.set(false);
        // Persistencia para CU-09. No bloquea la UI si IndexedDB no está disponible.
        void this.persistSnapshot(branches, apiProducts, stocks, sizes);
      },
      error: () => {
        void this.loadFromCache();
      },
    });
  }

  /** Acción manual “Preparar catálogo offline”. */
  prepareOffline(): void {
    this.refreshStock();
    this.showToast('Preparando catálogo y existencias para uso offline…');
  }

  private applySnapshot(
    branches: BranchResponse[],
    apiProducts: ProductResponse[],
    stocks: StockResponse[]
  ): void {
    if (!apiProducts || apiProducts.length === 0) {
      this.stockLoaded.set(true);
      return;
    }

    const mapped: FigmaProduct[] = apiProducts.map((apiProd) => {
      const existing = PRODUCTS.find(
        (p) =>
          p.id === apiProd.id ||
          p.name.trim().toLowerCase() === apiProd.name.trim().toLowerCase()
      );

      const variantIds = new Set(apiProd.variants.map((v) => v.id));
      const newStockMap: Record<string, number> = existing ? { ...existing.stock } : {};

      for (const branch of branches) {
        const bKey = branch.name.replace(/^Sucursal\s+/i, '').trim();
        const branchTotal = stocks
          .filter(
            (s) => s.branch_id === branch.id && variantIds.has(s.variant_id)
          )
          .reduce((sum, s) => sum + Math.max(0, s.available_stock), 0);

        newStockMap[bKey] = branchTotal;
        const capitalized = bKey.charAt(0).toUpperCase() + bKey.slice(1).toLowerCase();
        newStockMap[capitalized] = branchTotal;
      }

      if (existing) {
        return {
          ...existing,
          id: apiProd.id,
          name: apiProd.name,
          brand: apiProd.brand || existing.brand,
          price: Number(apiProd.price),
          wholesalePrice: apiProd.wholesale_price ? Number(apiProd.wholesale_price) : existing.wholesalePrice,
          wholesaleMinQty: apiProd.wholesale_min_quantity ?? existing.wholesaleMinQty,
          isClearance: apiProd.is_clearance,
          stock: newStockMap,
        };
      }

      // Producto exclusivo del Tenant (ej. Medias o Alta Costura)
      const img = this.resolveProductImage(apiProd.name);
      return {
        id: apiProd.id,
        name: apiProd.name,
        brand: apiProd.brand || 'Colección Exclusiva',
        category: this.resolveCategory(apiProd.name),
        price: Number(apiProd.price),
        oldPrice: Math.round(Number(apiProd.price) * 1.25 * 100) / 100,
        discount: 20,
        image: img,
        images: [img],
        colors: [
          { name: 'Blanco', hex: '#FFFFFF' },
          { name: 'Negro', hex: '#111827' },
          { name: 'Gris', hex: '#6B7280' },
        ],
        sizes: apiProd.variants.length > 0 ? [...new Set(apiProd.variants.map(v => v.size_id ? String(v.size_id) : 'M'))] : ['S', 'M', 'L'],
        description: this.resolveDescription(apiProd.name),
        stock: newStockMap,
        rating: 4.9,
        reviews: 32,
        isFeatured: true,
        wholesalePrice: apiProd.wholesale_price ? Number(apiProd.wholesale_price) : Math.round(Number(apiProd.price) * 0.85 * 100) / 100,
        wholesaleMinQty: apiProd.wholesale_min_quantity ?? 3,
        isClearance: apiProd.is_clearance,
      } as FigmaProduct;
    });

    this.products.set(mapped);
    this.stockLoaded.set(true);
  }

  private resolveProductImage(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('deportiva')) {
      return 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('compresión') || n.includes('compresion')) {
      return 'https://images.unsplash.com/photo-1582966772680-860e372bb558?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('térmica') || n.includes('termica') || n.includes('polar')) {
      return 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('invisible') || n.includes('antideslizante')) {
      return 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('panti') || n.includes('seda')) {
      return 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('gala') || n.includes('vestido')) {
      return 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('traje') || n.includes('ejecutivo')) {
      return 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80';
  }

  private resolveCategory(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('media') || n.includes('panti')) return 'Accesorios';
    if (n.includes('traje')) return 'Hombre';
    if (n.includes('vestido') || n.includes('gala')) return 'Mujer';
    return 'Todas';
  }

  private resolveDescription(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('media') || n.includes('panti')) {
      return 'Confeccionadas con algodón peinado y fibras elásticas de alta durabilidad, respirabilidad y ajuste ergonómico.';
    }
    if (n.includes('gala') || n.includes('traje')) {
      return 'Confección de alta costura con textiles premium de importación y terminaciones de lujo.';
    }
    return 'Prenda de confección de alta calidad con diseño exclusivo.';
  }

  private async persistSnapshot(
    branches: BranchResponse[],
    apiProducts: ProductResponse[],
    stocks: StockResponse[],
    sizes: SizeResponse[]
  ): Promise<void> {
    try {
      await this.db.saveCatalog(apiProducts);
      await this.db.saveInventory(stocks);
      await this.db.saveBranches(branches);
      await this.db.saveSizes(sizes);
      this.lastCachedAt.set(new Date().toISOString());
    } catch {
      // IndexedDB puede estar deshabilitado (modo privado); la app sigue online.
    }
  }

  private async loadFromCache(): Promise<void> {
    try {
      const [branches, apiProducts, stocks] = await Promise.all([
        this.db.getBranches(),
        this.db.getCatalog(),
        this.db.getInventory(),
      ]);

      if (apiProducts.length > 0 && branches.length > 0) {
        this.applySnapshot(branches, apiProducts, stocks);
        this.servedFromCache.set(true);
        this.showToast('Sin conexión: catálogo y existencias cargados desde IndexedDB.');
      } else {
        // Nunca se preparó la copia offline: se mantienen los datos demo precargados.
        this.stockLoaded.set(true);
        this.servedFromCache.set(true);
      }
    } catch {
      this.stockLoaded.set(true);
      this.servedFromCache.set(true);
    }
  }

  readonly cartCount = computed(() =>
    this.cart().reduce((sum, item) => sum + item.qty, 0)
  );

  readonly subtotal = computed(() =>
    this.cart().reduce((sum, item) => {
      const minQty = item.wholesaleMinQty ?? 3;
      const unitPrice =
        item.wholesalePrice && item.qty >= minQty ? item.wholesalePrice : item.price;
      return sum + unitPrice * item.qty;
    }, 0)
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
      return this.products().filter((product) => product.discount >= 25 || product.isClearance);
    }
    return this.products().filter((product) => product.category === category);
  }

  add(product: FigmaProduct, size?: string, color?: string): void {
    const pickedSize = size ?? product.sizes[0] ?? 'M';
    const pickedColor = color ?? product.colors[0]?.name ?? '';
    const minQty = product.wholesaleMinQty ?? 3;
    const existing = this.cart().find(
      (item) => item.productId === product.id && item.size === pickedSize
    );

    if (existing) {
      const newQty = existing.qty + 1;
      const isWholesale = Boolean(product.wholesalePrice && newQty >= minQty);
      this.cart.update((items) =>
        items.map((item) =>
          item.productId === product.id && item.size === pickedSize
            ? { ...item, qty: newQty, isWholesaleApplied: isWholesale }
            : item
        )
      );
    } else {
      const isWholesale = Boolean(product.wholesalePrice && 1 >= minQty);
      this.cart.update((items) => [
        ...items,
        {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          wholesalePrice: product.wholesalePrice ?? Math.round(product.price * 0.8 * 100) / 100,
          wholesaleMinQty: minQty,
          isWholesaleApplied: isWholesale,
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
      items.map((item) => {
        if (item.productId === productId && item.size === size) {
          const newQty = item.qty + 1;
          const minQty = item.wholesaleMinQty ?? 3;
          const isWholesale = Boolean(item.wholesalePrice && newQty >= minQty);
          return { ...item, qty: newQty, isWholesaleApplied: isWholesale };
        }
        return item;
      })
    );
  }

  dec(productId: number, size: string): void {
    this.cart.update((items) =>
      items.map((item) => {
        if (item.productId === productId && item.size === size) {
          const newQty = Math.max(1, item.qty - 1);
          const minQty = item.wholesaleMinQty ?? 3;
          const isWholesale = Boolean(item.wholesalePrice && newQty >= minQty);
          return { ...item, qty: newQty, isWholesaleApplied: isWholesale };
        }
        return item;
      })
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
