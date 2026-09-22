import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FigmaProduct } from '../../core/figma-data';
import { CatalogStore } from '../../core/services/catalog-store.service';

interface PromoHero {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  color: string;
  ends: string;
  code: string;
}

const U = 'https://images.unsplash.com/photo-';

/** CU20 — Colecciones y promociones activas (vista del cliente, web). */
const PROMOS: PromoHero[] = [
  {
    id: 'fall',
    title: 'Otoño · Invierno 2026',
    subtitle: 'Hasta 40% OFF',
    image: `${U}1558618666-fcd25c85cd64?w=800&h=400&fit=crop&auto=format`,
    color: '#111827',
    ends: '30 Sep 2026',
    code: 'OTOÑO40',
  },
  {
    id: 'shoes',
    title: 'Semana del Calzado',
    subtitle: '30% en toda la línea',
    image: `${U}1605523741177-cd660595c2cf?w=800&h=400&fit=crop&auto=format`,
    color: '#E05A47',
    ends: '22 Sep 2026',
    code: 'CALZADO30',
  },
  {
    id: 'men',
    title: 'Moda Masculina',
    subtitle: 'Nuevos arrivals + 25% OFF',
    image: `${U}1603189343302-e603f7add05a?w=800&h=400&fit=crop&auto=format`,
    color: '#374151',
    ends: '28 Sep 2026',
    code: 'HOMBRE25',
  },
];

/**
 * CU20 — Colecciones y promociones (vista del cliente, web).
 * Reproduce `design/figma-make/src/web/screens/PromotionsPage.tsx`.
 */
@Component({
  selector: 'app-promotions-page',
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './promotions.page.html',
  styleUrl: './promotions.page.scss',
})
export class PromotionsPage {
  readonly store = inject(CatalogStore);
  readonly promos = PROMOS;

  /** Prendas con descuento del 25% o más (máximo 8, como el diseño). */
  get saleProducts(): FigmaProduct[] {
    return this.store
      .products()
      .filter((product) => product.discount >= 25)
      .slice(0, 8);
  }

  copyCode(code: string): void {
    this.store.showToast(`Código ${code} copiado al portapapeles`);
  }
}
