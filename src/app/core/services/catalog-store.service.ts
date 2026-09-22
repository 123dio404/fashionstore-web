import { Injectable, computed, signal } from '@angular/core';

import { FigmaCartItem, FigmaProduct, PRODUCTS } from '../figma-data';

/**
 * Estado del catálogo público: espejo de `App.tsx` / `AppState` del móvil.
 * Guarda los productos demo (con imágenes), el carrito, los favoritos y el toast.
 */
@Injectable({ providedIn: 'root' })
export class CatalogStore {
  readonly products = signal<FigmaProduct[]>(PRODUCTS);
  readonly cart = signal<FigmaCartItem[]>([]);
  readonly favs = signal<number[]>([]);
  readonly toast = signal<string | null>(null);

  private toastTimer?: ReturnType<typeof setTimeout>;

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
