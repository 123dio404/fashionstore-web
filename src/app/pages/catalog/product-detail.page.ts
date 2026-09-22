import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  AR_MODES,
  AR_VIEWER_TAG,
  FigmaProduct,
  STORES,
  arModelFor,
  arModelSourceFor,
} from '../../core/figma-data';
import { CatalogStore } from '../../core/services/catalog-store.service';

/**
 * CU17 — superficie del `<model-viewer>` que consume el vestidor
 * (API pública del componente estándar de Google).
 */
interface ArCapableElement extends HTMLElement {
  canActivateAR?: boolean;
  activateAR?: () => Promise<void> | void;
  toDataURL?: (type?: string, encoderOptions?: number) => string;
}

/**
 * CU08 / CU10 / CU17 — Detalle de prenda: galería, color, talla, stock por
 * sucursal, carrito y Vestidor Virtual AR (visor 3D real + sesión ARCore).
 * Reproduce `design/figma-make/src/web/screens/ProductDetailPage.tsx`.
 */
@Component({
  selector: 'app-product-detail-page',
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './product-detail.page.html',
  styleUrl: './product-detail.page.scss',
  // CU17: `<model-viewer>` es un elemento personalizado estándar (fuera de Angular).
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProductDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(CatalogStore);

  readonly stores = STORES;

  /** Paths de los iconos del diseño (corazón y estrella). */
  readonly heartPath =
    'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';
  readonly starPath =
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z';

  readonly product = signal<FigmaProduct | undefined>(undefined);
  readonly imgIdx = signal(0);
  readonly colorIdx = signal(0);
  readonly qty = signal(1);
  readonly size = signal('');
  readonly added = signal(false);
  readonly openAcc = signal<string | null>('desc');

  /** CU17 — Vestidor Virtual AR (visor 3D real + sesión ARCore). */
  readonly arViewer = viewChild<ElementRef<ArCapableElement>>('arViewer');
  readonly arReady = signal(false);
  readonly arAvailable = signal(false);
  readonly arNotice = signal<string | null>(null);
  readonly arModes = AR_MODES;
  readonly arModel = computed(() => arModelFor(this.product()));
  readonly arSource = computed(() => arModelSourceFor(this.product()));

  readonly isFav = computed(() => {
    const p = this.product();
    return p ? this.store.isFav(p.id) : false;
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      this.product.set(this.store.byId(id));
      this.imgIdx.set(0);
      this.colorIdx.set(0);
      this.size.set('');
      this.qty.set(1);
    });
    void this.initArViewer();
  }

  /* ------------------------------------------------------------- CU17 ----- */

  /**
   * Espera a que el componente estándar esté registrado (`index.html` lo carga del
   * CDN de Google) y deja el visor listo; si el script no llega, el CU lo informa.
   */
  private async initArViewer(): Promise<void> {
    const registry = globalThis.customElements;
    if (!registry) return;
    try {
      await registry.whenDefined(AR_VIEWER_TAG);
      this.arReady.set(true);
    } catch {
      this.arNotice.set(
        'No se pudo cargar el visor 3D. Revisa tu conexión e inténtalo de nuevo.',
      );
    }
  }

  /** Consulta si el equipo puede abrir una sesión AR real (ARCore o Quick Look). */
  probeAr(): void {
    this.arAvailable.set(Boolean(this.arViewer()?.nativeElement?.canActivateAR));
  }

  /** Abre la sesión AR: Scene Viewer (ARCore) en Android o Quick Look en iOS. */
  launchAr(): void {
    const element = this.arViewer()?.nativeElement;
    if (!element) {
      this.arNotice.set('El visor 3D aún se está cargando.');
      return;
    }
    this.probeAr();
    if (!element.canActivateAR) {
      this.arNotice.set(
        'Este equipo no puede abrir AR: gira el modelo aquí o ábrelo desde un móvil con ARCore.',
      );
      return;
    }
    void element.activateAR?.();
    this.arNotice.set(
      'Sesión AR abierta: apunta al piso o la mesa para anclar la prenda a escala 1:1.',
    );
  }

  /** Captura la vista 3D actual del vestidor como PNG descargable. */
  captureAr(): void {
    const dataUrl = this.arViewer()?.nativeElement?.toDataURL?.('image/png');
    if (!dataUrl) {
      this.arNotice.set('El visor 3D aún no está listo para capturar.');
      return;
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `fashionstore-ar-${this.product()?.id ?? 'prenda'}.png`;
    link.click();
    this.arNotice.set('Captura guardada como PNG.');
  }

  get accordions(): { id: string; label: string; content: string }[] {
    const p = this.product();
    if (!p) return [];
    return [
      { id: 'desc', label: 'Descripción', content: p.description },
      {
        id: 'care',
        label: 'Cuidado',
        content:
          '60% Lana · 40% Poliéster\nLavar en seco. No usar secadora.\nPlanchar a temperatura baja.',
      },
    ];
  }

  toggleFav(): void {
    const p = this.product();
    if (p) this.store.toggleFav(p.id);
  }

  toggleAcc(id: string): void {
    this.openAcc.update((current) => (current === id ? null : id));
  }

  inc(): void {
    this.qty.update((value) => Math.min(9, value + 1));
  }

  dec(): void {
    this.qty.update((value) => Math.max(1, value - 1));
  }

  colorName(): string {
    const p = this.product();
    return p?.colors[this.colorIdx()]?.name ?? '';
  }

  add(): void {
    const p = this.product();
    const pickedSize = this.size();
    if (!p || !pickedSize) return;

    const color = this.colorName();
    for (let i = 0; i < this.qty(); i += 1) {
      this.store.add(p, pickedSize, color);
    }
    this.added.set(true);
    this.qty.set(1);
    setTimeout(() => this.added.set(false), 1800);
  }

  /** Stock de una sucursal (`centro` → clave `Centro`). */
  stockOf(storeId: string): number {
    const p = this.product();
    if (!p) return 0;
    const key = storeId.charAt(0).toUpperCase() + storeId.slice(1);
    return p.stock[key] ?? 0;
  }

  stockLabel(storeId: string): string {
    const qty = this.stockOf(storeId);
    if (qty === 0) return 'Sin stock';
    if (qty <= 2) return `Últimas ${qty} unid.`;
    return `${qty} disponibles`;
  }

  stockTone(storeId: string): string {
    const qty = this.stockOf(storeId);
    if (qty === 0) return 'out';
    if (qty <= 2) return 'low';
    return 'ok';
  }
}
