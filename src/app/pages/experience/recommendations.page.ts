import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ExperienceService } from '../../core/services/experience.service';
import { ProductsService } from '../../core/services/products.service';
import {
  CategoryResponse,
  ColorResponse,
  RecommendationResponse,
  SizeResponse
} from '../../models';
import { UiEmptyComponent } from '../../shared/ui/empty-state.component';

/**
 * CU18 — Recomendaciones personalizadas: preferencias del cliente, sugerencias con su motivo,
 * cantidad disponible y estado del bloque.
 */
@Component({
  selector: 'app-recommendations-page',
  imports: [CommonModule, FormsModule, RouterLink, UiEmptyComponent],
  templateUrl: './recommendations.page.html',
  styleUrl: './recommendations.page.scss'
})
export class RecommendationsPage {
  private readonly experience = inject(ExperienceService);
  private readonly products = inject(ProductsService);

  readonly result = signal<RecommendationResponse | null>(null);
  readonly history = signal<RecommendationResponse[]>([]);
  readonly categories = signal<CategoryResponse[]>([]);
  readonly colors = signal<ColorResponse[]>([]);
  readonly sizes = signal<SizeResponse[]>([]);
  readonly categoryId = signal<number | null>(null);
  readonly preferredColors = signal<string[]>([]);
  readonly preferredSizes = signal<number[]>([]);
  readonly preferredColorList = this.preferredColors.asReadonly();
  readonly preferredSizeList = this.preferredSizes.asReadonly();
  readonly generating = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  preferredBrand = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  constructor() {
    this.loadPreferences();
    this.loadHistory();
    this.products.listCategories().subscribe((items) => this.categories.set(items));
    this.products.listColors().subscribe((items) => this.colors.set(items));
    this.products.listSizes().subscribe((items) => this.sizes.set(items));
  }

  /** La API devuelve la puntuación 0-100; se muestra redondeada como coincidencia. */
  score(value: number): number {
    return Math.round(Number(value) || 0);
  }

  /** El backend guarda los motivos como una lista separada por comas. */
  reasonChips(reason: string | null): string[] {
    if (!reason) return [];
    return reason
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  toggleColor(name: string): void {
    this.preferredColors.update((colors) =>
      colors.includes(name) ? colors.filter((item) => item !== name) : [...colors, name]
    );
  }

  toggleSize(id: number): void {
    this.preferredSizes.update((sizes) =>
      sizes.includes(id) ? sizes.filter((item) => item !== id) : [...sizes, id]
    );
  }

  loadPreferences(): void {
    this.experience.getPreferences().subscribe({
      next: (preferences) => {
        if (!preferences) return;
        this.preferredBrand = preferences.preferred_brand ?? '';
        this.preferredColors.set(preferences.preferred_colors ?? []);
        this.preferredSizes.set(preferences.preferred_sizes ?? []);
        this.categoryId.set(preferences.category_id);
        this.minPrice = preferences.min_price;
        this.maxPrice = preferences.max_price;
      },
      error: (err: Error) => this.error.set(err.message)
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
      error: (err: Error) => this.error.set(err.message)
    });
  }

  savePreferences(): void {
    this.error.set(null);
    this.message.set(null);
    this.experience
      .savePreferences({
        category_id: this.categoryId(),
        preferred_brand: this.preferredBrand || null,
        preferred_colors: this.preferredColors(),
        preferred_sizes: this.preferredSizes(),
        min_price: this.minPrice,
        max_price: this.maxPrice
      })
      .subscribe({
        next: () => {
          this.message.set('Preferencias guardadas.');
          this.loadPreferences();
        },
        error: (err: Error) => this.error.set(err.message)
      });
  }

  generate(): void {
    this.generating.set(true);
    this.error.set(null);
    this.message.set(null);
    this.experience.generateRecommendations(10).subscribe({
      next: (block) => {
        this.result.set(block);
        this.message.set('Recomendaciones generadas.');
        this.generating.set(false);
        this.loadHistory();
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.generating.set(false);
      }
    });
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
      error: (err: Error) => this.error.set(err.message)
    });
  }
}
