import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ExperienceService } from '../../core/services/experience.service';
import { RecommendationResponse } from '../../models';

@Component({
  selector: 'app-recommendations-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Recomendaciones personalizadas</h2>
    <p class="muted">
      Define tus preferencias y genera sugerencias de prendas con IA según tu historial.
    </p>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (message()) {
      <p class="success">{{ message() }}</p>
    }

    <div class="card">
      <h3>Mis preferencias</h3>
      <div class="grid-2">
        <div>
          <label for="brand">Marca preferida</label>
          <input id="brand" [(ngModel)]="preferredBrand" />
        </div>
        <div>
          <label for="colors">Colores (separados por coma)</label>
          <input id="colors" [(ngModel)]="preferredColors" />
        </div>
        <div>
          <label for="sizes">IDs de tallas (separados por coma)</label>
          <input id="sizes" [(ngModel)]="preferredSizes" />
        </div>
        <div>
          <label for="min">Precio mínimo</label>
          <input id="min" type="number" min="0" [(ngModel)]="minPrice" />
        </div>
        <div>
          <label for="max">Precio máximo</label>
          <input id="max" type="number" min="0" [(ngModel)]="maxPrice" />
        </div>
      </div>
      <br />
      <button class="btn-primary" (click)="savePreferences()">Guardar preferencias</button>
      <button class="btn" [disabled]="generating()" (click)="generate()">
        {{ generating() ? 'Generando...' : 'Generar recomendaciones' }}
      </button>
    </div>

    @if (result(); as recommendation) {
      <div class="card">
        <div class="row">
          <h3 style="margin: 0">Sugerencias</h3>
          <span class="badge">{{ recommendation.recommendation_type }}</span>
        </div>
        @if (recommendation.items.length === 0) {
          <p class="muted">No se generaron recomendaciones.</p>
        }
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Puntaje</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            @for (item of recommendation.items; track item.id) {
              <tr>
                <td>#{{ item.product_id }}</td>
                <td>{{ item.score }}</td>
                <td>{{ item.reason || '-' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class RecommendationsPage {
  private readonly experience = inject(ExperienceService);

  preferredBrand = '';
  preferredColors = '';
  preferredSizes = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  readonly result = signal<RecommendationResponse | null>(null);
  readonly generating = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  constructor() {
    this.experience.getPreferences().subscribe({
      next: (prefs) => {
        if (!prefs) return;
        this.preferredBrand = prefs.preferred_brand ?? '';
        this.preferredColors = (prefs.preferred_colors ?? []).join(', ');
        this.preferredSizes = (prefs.preferred_sizes ?? []).join(', ');
        this.minPrice = prefs.min_price;
        this.maxPrice = prefs.max_price;
      }
    });
  }

  private parseList(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  savePreferences(): void {
    this.error.set(null);
    const colors = this.parseList(this.preferredColors);
    const sizes = this.parseList(this.preferredSizes)
      .map((value) => Number(value))
      .filter((value) => !Number.isNaN(value));

    this.experience
      .savePreferences({
        preferred_brand: this.preferredBrand || null,
        preferred_colors: colors,
        preferred_sizes: sizes,
        min_price: this.minPrice,
        max_price: this.maxPrice
      })
      .subscribe({
        next: () => this.message.set('Preferencias guardadas.'),
        error: (err: Error) => this.error.set(err.message)
      });
  }

  generate(): void {
    this.generating.set(true);
    this.error.set(null);
    this.experience.generateRecommendations(10).subscribe({
      next: (response) => {
        this.result.set(response);
        this.generating.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.generating.set(false);
      }
    });
  }
}
