import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { FigmaCartItem, FigmaProduct, PRODUCTS, resolveProductImage } from '../figma-data';
import { environment } from '../../../environments/environment';
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

  readonly products = signal<FigmaProduct[]>([]);
  readonly cart = signal<FigmaCartItem[]>([]);
  readonly favs = signal<number[]>([]);
  readonly toast = signal<string | null>(null);
  readonly stockLoaded = signal(false);
  /** true cuando el mapa de stock mostrado proviene de IndexedDB (sin red). */
  readonly servedFromCache = signal(false);
  readonly lastCachedAt = signal<string | null>(null);

  private toastTimer?: ReturnType<typeof setTimeout>;
  private activeTenantKey: string | null = null;

  constructor() {
    this.refreshStock();
  }

  /**
   * Llamado cuando cambia la sesión o el tenant activo: limpia carrito/favoritos/catálogo
   * previo para evitar mezclar productos entre empresas y recarga desde la API.
   */
  onSessionChange(userOrTenantKey: string | null): void {
    if (this.activeTenantKey !== null && this.activeTenantKey !== userOrTenantKey) {
      this.cart.set([]);
      this.favs.set([]);
      this.products.set([]);
      this.stockLoaded.set(false);
    }
    this.activeTenantKey = userOrTenantKey;
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
        this.applySnapshot(branches, apiProducts, stocks, sizes);
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
    stocks: StockResponse[],
    sizes: SizeResponse[] = []
  ): void {
    if (!apiProducts || apiProducts.length === 0) {
      this.products.set([]);
      this.stockLoaded.set(true);
      return;
    }

    const sizeMap = new Map<number, string>();
    for (const sz of sizes) {
      sizeMap.set(sz.id, sz.name);
    }

    const mapped: FigmaProduct[] = apiProducts.map((apiProd) => {
      // ⚠️ No emparejar por `id` numérico para evitar colisiones con IDs auto-incrementales del backend
      const existing = PRODUCTS.find(
        (p) => p.name.trim().toLowerCase() === apiProd.name.trim().toLowerCase()
      );

      const variantIds = new Set(apiProd.variants.map((v) => v.id));
      const newStockMap: Record<string, number> = {};

      for (const branch of branches) {
        const bKey = branch.name.replace(/^Sucursal\s+/i, '').trim();
        const branchTotal = stocks
          .filter(
            (s) => s.branch_id === branch.id && variantIds.has(s.variant_id)
          )
          .reduce((sum, s) => sum + Math.max(0, s.available_stock), 0);

        newStockMap[bKey] = branchTotal;
        newStockMap[String(branch.id)] = branchTotal;
        const capitalized = bKey.charAt(0).toUpperCase() + bKey.slice(1).toLowerCase();
        newStockMap[capitalized] = branchTotal;
      }

      const serverImg = apiProd.image_url?.trim();
      const normalizedImg = serverImg?.startsWith('/uploads/')
        ? `${environment.apiUrl.replace(/\/api\/v1\/?$/, '')}${serverImg}`
        : serverImg;
      const img = normalizedImg || resolveProductImage(apiProd.name);

      const resolvedSizes =
        apiProd.variants.length > 0
          ? [
              ...new Set(
                apiProd.variants.map((v) =>
                  v.size_id ? (sizeMap.get(v.size_id) ?? 'M') : 'M'
                )
              ),
            ]
          : ['S', 'M', 'L'];

      if (existing) {
        return {
          ...existing,
          id: apiProd.id,
          name: apiProd.name,
          category: apiProd.category_name || existing.category,
          brand: apiProd.brand || existing.brand,
          image: img,
          images: [img],
          sizes: resolvedSizes,
          price: Number(apiProd.price),
          wholesalePrice: apiProd.wholesale_price ? Number(apiProd.wholesale_price) : existing.wholesalePrice,
          wholesaleMinQty: apiProd.wholesale_min_quantity ?? existing.wholesaleMinQty,
          isClearance: apiProd.is_clearance,
          stock: newStockMap,
        };
      }

      // Producto exclusivo del Tenant (los 9 tenants especializados)
      return {
        id: apiProd.id,
        name: apiProd.name,
        brand: apiProd.brand || 'Colección Exclusiva',
        category: apiProd.category_name || this.resolveCategory(apiProd.name),
        price: Number(apiProd.price),
        oldPrice: Math.round(Number(apiProd.price) * 1.25 * 100) / 100,
        discount: Number(apiProd.discount_percentage) > 0 ? Number(apiProd.discount_percentage) : 20,
        image: img,
        images: [img],
        colors: [
          { name: 'Negro', hex: '#111827' },
          { name: 'Blanco', hex: '#F8F9FA' },
          { name: 'Gris', hex: '#6B7280' },
        ],
        sizes: resolvedSizes,
        description: this.resolveDescription(apiProd.name),
        stock: newStockMap,
        rating: 4.9,
        reviews: 32,
        isFeatured: true,
        wholesalePrice: apiProd.wholesale_price ? Number(apiProd.wholesale_price) : Math.round(Number(apiProd.price) * 0.85 * 100) / 100,
        wholesaleMinQty: apiProd.wholesale_min_quantity ?? 3,
        material: apiProd.material,
        secondaryColor: apiProd.secondary_color,
        isClearance: apiProd.is_clearance,
        model3dUrl: apiProd.model_3d_url,
      } as FigmaProduct;
    });

    this.products.set(mapped);
    this.stockLoaded.set(true);
  }

  private resolveProductImage(name: string): string {
    const n = name.toLowerCase();

    // ── CALCETERÍA (Mundo Medias) ──────────────────────────
    if (n.includes('invisible') || n.includes('antideslizante')) {
      return 'https://images.unsplash.com/photo-1585499583264-491df5142e83?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('tobillera') || n.includes('deportiva')) {
      return 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('térmica') || n.includes('termica') || n.includes('polar')) {
      return 'https://images.unsplash.com/photo-1646725582781-c09e1bcd431d?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('compresión') || n.includes('compresion')) {
      return 'https://images.unsplash.com/photo-1582966772680-860e372bb558?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('panti') || n.includes('pantis')) {
      return 'https://images.unsplash.com/photo-1789304795560-8e6718c809dd?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('ejecutiva') || n.includes('escocia')) {
      return 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('merino') || n.includes('senderismo')) {
      return 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('bucanera') || n.includes('canalé') || n.includes('canale')) {
      return 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80';
    }

    // ── ALTA COSTURA & LUJO (Elegance Boutique) ───────────
    if (n.includes('smoking') || n.includes('esmoquin') || n.includes('black tie')) {
      return 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('traje') || n.includes('ejecutivo')) {
      return 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('seda royale') || n.includes('gala') || n.includes('noche')) {
      return 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('sirena') || n.includes('corset')) {
      return 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('cachemira') || n.includes('abrigo')) {
      return 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('plisado') || n.includes('champagne')) {
      return 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('blusa') || n.includes('organza') || n.includes('crepe')) {
      return 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('doble botonadura') || n.includes('sartorial')) {
      return 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80';
    }

    // ── STREETWEAR & MODA URBANA (Moda Urbana) ────────────
    if (n.includes('hoodie') || n.includes('sudadera')) {
      return 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('cargo') || n.includes('pantalon') || n.includes('pantalón')) {
      return 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('oxford') || (n.includes('camisa') && n.includes('streetwear'))) {
      return 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('remera') || n.includes('camiseta') || n.includes('t-shirt')) {
      return 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('chunky') || n.includes('sneakers blancas')) {
      return 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('sneaker') || n.includes('zapatilla')) {
      return 'https://images.unsplash.com/photo-1605523741177-cd660595c2cf?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('denim') || n.includes('vaquera')) {
      return 'https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('windbreaker') || n.includes('rompevientos') || n.includes('bomber')) {
      return 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('jogger') || n.includes('baggy')) {
      return 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('gorra') || n.includes('cap') || n.includes('trucker')) {
      return 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&auto=format&fit=crop&q=80';
    }

    // ── VESTIDOS Y PRENDAS FEMENINAS GENERALES ────────────
    if (n.includes('rojo') && n.includes('vestido')) {
      return 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('fluido') || (n.includes('vestido') && n.includes('midi'))) {
      return 'https://images.unsplash.com/photo-1664076458686-3449062080ac?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('vestido')) {
      return 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('blazer oversize') || n.includes('blazer lana')) {
      return 'https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('blazer')) {
      return 'https://images.unsplash.com/photo-1629511565591-a1d494ad6c58?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('acanalado') || n.includes('punto')) {
      return 'https://images.unsplash.com/photo-1645996830718-127f7e4f74fc?w=800&auto=format&fit=crop&q=80';
    }

    // ── ACCESORIOS REALES (Solo si el nombre explícitamente lo dice) ──
    if (n.includes('gafas') || n.includes('lentes')) {
      return 'https://images.unsplash.com/photo-1511499767150-a48a237f008?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('collar')) {
      return 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('reloj') || n.includes('watch')) {
      return 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b?w=800&auto=format&fit=crop&q=80';
    }
    if (n.includes('sombrero') || n.includes('fedora')) {
      return 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0?w=800&auto=format&fit=crop&q=80';
    }

    return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80';
  }

  private resolveCategory(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('media') || n.includes('panti') || n.includes('calcet')) return 'Calcetería';
    if (n.includes('traje') || n.includes('smoking') || n.includes('esmoquin') || n.includes('blazer doble')) return 'Sastrería';
    if (n.includes('vestido') || n.includes('gala') || n.includes('sirena') || n.includes('blusa') || n.includes('plisado')) return 'Alta Costura';
    if (n.includes('hoodie') || n.includes('cargo') || n.includes('remera') || n.includes('jogger') || n.includes('windbreaker') || n.includes('streetwear')) return 'Streetwear';
    if (n.includes('sneaker') || n.includes('zapatilla')) return 'Calzado';
    if (n.includes('gafas') || n.includes('collar') || n.includes('reloj') || n.includes('sombrero') || n.includes('gorra')) return 'Accesorios';
    return 'Colección';
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
