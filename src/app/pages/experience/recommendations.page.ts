import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { ICONS } from '../../core/navigation';
import { ExperienceService } from '../../core/services/experience.service';
import { ProductsService } from '../../core/services/products.service';
import {
  CategoryResponse,
  ProductResponse,
  RecommendationResponse,
  SizeResponse,
  UserPreferenceUpsert,
} from '../../models';
import { UiIconComponent } from '../../shared/ui/icon.component';

const ICON_HEART =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';
const ICON_PLUS = ['M12 5v14', 'M5 12h14'];

interface CategoryOption {
  id: number | null;
  name: string;
}

/**
 * CU18 — Recomendaciones IA: réplica del frame «Para ti · IA» del diseño web de Figma.
 * Panel «Tu estilo» (marca, categoría, tallas, presupuesto y colores) a la izquierda,
 * cuadrícula de resultados a la derecha con coincidencia, motivos y acciones, y
 * sección «Mis recomendaciones anteriores».
 */
@Component({
  selector: 'app-recommendations-page',
  imports: [CommonModule, FormsModule, RouterLink, UiIconComponent],
  templateUrl: './recommendations.page.html',
  styleUrl: './recommendations.page.scss',
})
export class RecommendationsPage {
  private readonly experience = inject(ExperienceService);
  private readonly products = inject(ProductsService);
  private readonly router = inject(Router);

  readonly icons = ICONS;
  readonly heart = ICON_HEART;
  readonly plus = ICON_PLUS;

  /** Swatches del bloque «Colores» del prototipo (deshabilitado: PRÓXIMAMENTE). */
  readonly colorSwatches = ['#111827', '#e05a47', '#d4c5a9', '#6b7280', '#f4f4f5'];

  readonly result = signal<RecommendationResponse | null>(null);
  readonly history = signal<RecommendationResponse[]>([]);
  readonly categories = signal<CategoryResponse[]>([]);
  readonly sizes = signal<SizeResponse[]>([]);
  readonly catalog = signal<ProductResponse[]>([]);
  readonly favs = signal<Set<number>>(new Set());
  readonly preferredSizes = signal<number[]>([]);
  readonly preferredColors = signal<string[]>([]);
  readonly generating = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly budgetError = signal<string | null>(null);

  readonly preferredSizeList = this.preferredSizes.asReadonly();

  /** Marca favorita = selección ÚNICA (regla del prototipo); '' representa «Todas las marcas». */
  selectedBrand = '';
  /** Categoría favorita = selección ÚNICA; null representa «Todas». */
  selectedCategoryId: number | null = null;
  minBudget = '';
  maxBudget = '';

  readonly allBrands = computed(() => {
    const values = this.catalog()
      .map((product) => product.brand)
      .filter((value): value is string => Boolean(value));
    return [...new Set(values)].sort();
  });

  readonly brandOptions = computed(() => ['Todas las marcas', ...this.allBrands()]);

  readonly categoryOptions = computed<CategoryOption[]>(() => [
    { id: null, name: 'Todas' },
    ...this.categories().map((category) => ({ id: category.id, name: category.name })),
  ]);

  readonly subtitle = computed(() => {
    const block = this.result();
    if (!block) return 'Configura tus preferencias y genera recomendaciones personalizadas';
    const count = block.items.length;
    return `${count} ${count === 1 ? 'producto' : 'productos'} seleccionados para ti`;
  });

  constructor() {
    this.loadPreferences();
    this.loadHistory();
    this.products.listCategories().subscribe((items) => this.categories.set(items));
    this.products.listSizes().subscribe((items) => this.sizes.set(items));
    this.products.list().subscribe((items) => this.catalog.set(items));
  }

  /** La API devuelve la puntuación 0-100; se muestra redondeada como coincidencia. */
  score(value: number): number {
    return Math.round(Number(value) || 0);
  }

  /** Color de la barra de coincidencia: ≥65 éxito, ≥40 acento, el resto muted-light. */
  matchColor(value: number): string {
    const score = this.score(value);
    return score >= 65 ? 'var(--success)' : score >= 40 ? 'var(--brand)' : 'var(--muted-2)';
  }

  /** El backend guarda los motivos como una lista separada por comas. */
  reasonChips(reason: string | null): string[] {
    if (!reason) return [];
    return reason
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  initials(product: { name: string; brand: string | null } | null): string {
    return (product?.brand || product?.name || 'P').charAt(0).toUpperCase();
  }

  /** Moneda según las reglas del prototipo: `$ 0.00`. */
  priceText(price: number): string {
    return `$ ${Number(price).toFixed(2)}`;
  }

  selectBrand(brand: string): void {
    this.selectedBrand = brand;
  }

  selectCategory(id: number | null): void {
    this.selectedCategoryId = id;
  }

  toggleSize(id: number): void {
    this.preferredSizes.update((sizes) =>
      sizes.includes(id) ? sizes.filter((item) => item !== id) : [...sizes, id],
    );
  }

  toggleFav(id: number): void {
    this.favs.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isFav(id: number): boolean {
    return this.favs().has(id);
  }

  openProduct(id: number): void {
    this.router.navigate(['/catalog', id]);
  }

  loadPreferences(): void {
    this.experience.getPreferences().subscribe({
      next: (preferences) => {
        if (!preferences) return;
        this.selectedBrand = preferences.preferred_brand ?? 'Todas las marcas';
        this.selectedCategoryId = preferences.category_id;
        this.preferredColors.set(preferences.preferred_colors ?? []);
        this.preferredSizes.set(preferences.preferred_sizes ?? []);
        this.minBudget = preferences.min_price == null ? '' : String(preferences.min_price);
        this.maxBudget = preferences.max_price == null ? '' : String(preferences.max_price);
      },
      error: (err: Error) => this.error.set(err.message),
    });
  }

  loadHistory(): void {
    this.experience.listRecommendations(10).subscribe({
      next: (blocks) => {
        this.history.set(blocks);
        if (!this.result() && blocks.length > 0) {
          this.result.set(blocks[0]);
        }
      },
      error: (err: Error) => this.error.set(err.message),
    });
  }

  /** Guarda las preferencias «con un clic» y genera el bloque de recomendaciones. */
  generate(): void {
    const min = this.minBudget.trim() === '' ? null : Number(this.minBudget);
    const max = this.maxBudget.trim() === '' ? null : Number(this.maxBudget);
    if (min !== null && max !== null && min > max) {
      this.budgetError.set('El precio mínimo no puede ser mayor al máximo');
      return;
    }

    this.budgetError.set(null);
    this.error.set(null);
    this.message.set(null);
    this.generating.set(true);

    const payload: UserPreferenceUpsert = {
      category_id: this.selectedCategoryId,
      preferred_brand:
        this.selectedBrand === 'Todas las marcas' ? null : this.selectedBrand || null,
      preferred_colors: this.preferredColors(),
      preferred_sizes: this.preferredSizes(),
      min_price: min,
      max_price: max,
    };

    this.experience
      .savePreferences(payload)
      .pipe(switchMap(() => this.experience.generateRecommendations(10)))
      .subscribe({
        next: (block) => {
          this.result.set(block);
          this.message.set('Recomendaciones generadas.');
          this.generating.set(false);
          this.loadHistory();
        },
        error: (err: Error) => {
          this.error.set(err.message);
          this.generating.set(false);
        },
      });
  }

  /** Acción del estado «Sin resultados» del prototipo: ampliar presupuesto y reintentar. */
  widenBudget(): void {
    this.minBudget = '';
    this.maxBudget = '';
    this.generate();
  }

  markSeen(block: RecommendationResponse): void {
    this.updateStatus(block.id, 'visto', 'Bloque marcado como visto.');
  }

  discard(block: RecommendationResponse): void {
    this.updateStatus(block.id, 'descartado', 'Bloque descartado.');
  }

  private updateStatus(id: number, status: 'visto' | 'descartado', ok: string): void {
    this.error.set(null);
    this.experience.updateRecommendationStatus(id, status).subscribe({
      next: (updated) => {
        this.message.set(ok);
        this.result.set(updated);
        this.loadHistory();
      },
      error: (err: Error) => this.error.set(err.message),
    });
  }
}
