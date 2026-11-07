import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FigmaProduct } from '../../core/figma-data';
import { AuthService } from '../../core/services/auth.service';
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
  private readonly auth = inject(AuthService);

  get promos(): PromoHero[] {
    const user = this.auth.currentUser();
    const tenantName = (user?.tenant_name || '').toLowerCase();
    const email = (user?.email || '').toLowerCase();

    if (tenantName.includes('media') || email.includes('mundomedias')) {
      return [
        {
          id: 'socks-fall',
          title: 'Temporada Invierno · Medias Térmicas',
          subtitle: 'Hasta 30% OFF en packs térmicos',
          image: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?w=800&h=400&fit=crop&auto=format',
          color: '#064e3b',
          ends: '30 Sep 2026',
          code: 'MEDIAS30',
        },
        {
          id: 'socks-sport',
          title: 'Semana Deportiva · Calcetería Transpirable',
          subtitle: 'Pack x3 tobilleras con 25% OFF',
          image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&h=400&fit=crop&auto=format',
          color: '#047857',
          ends: '25 Sep 2026',
          code: 'SPORT25',
        },
        {
          id: 'socks-elegance',
          title: 'Pantis y Medias de Seda Fina',
          subtitle: 'Elegancia y máxima comodidad',
          image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=400&fit=crop&auto=format',
          color: '#0f766e',
          ends: '28 Sep 2026',
          code: 'SEDA15',
        },
      ];
    }

    if (tenantName.includes('elegance') || email.includes('elegance')) {
      return [
        {
          id: 'elegance-gala',
          title: 'Colección Alta Costura & Gala',
          subtitle: 'Hasta 25% OFF en Trajes y Vestidos',
          image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=400&fit=crop&auto=format',
          color: '#78350f',
          ends: '30 Sep 2026',
          code: 'ELEGANCE25',
        },
        {
          id: 'elegance-royale',
          title: 'Noche de Gala Seda Royale',
          subtitle: 'Diseño exclusivo de temporada',
          image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=400&fit=crop&auto=format',
          color: '#b45309',
          ends: '28 Sep 2026',
          code: 'ROYALE20',
        },
      ];
    }

    return PROMOS;
  }

  /** Prendas con descuento o del catálogo activo del tenant (máximo 8). */
  get saleProducts(): FigmaProduct[] {
    const all = this.store.products();
    const discounted = all.filter((product) => product.discount > 0);
    return (discounted.length > 0 ? discounted : all).slice(0, 8);
  }

  copyCode(code: string): void {
    this.store.showToast(`Código ${code} copiado al portapapeles`);
  }
}
