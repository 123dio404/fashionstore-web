import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MarketingService } from '../../core/services/marketing.service';
import {
  CollectionCreate,
  CollectionResponse,
  PromotionCreate,
  PromotionResponse
} from '../../models';

@Component({
  selector: 'app-marketing-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Colecciones y promociones</h2>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (message()) {
      <p class="success">{{ message() }}</p>
    }

    <div class="card">
      <h3>Nueva colección</h3>
      <div class="grid-2">
        <div>
          <label for="cname">Nombre</label>
          <input id="cname" [(ngModel)]="collection.name" />
        </div>
        <div>
          <label for="cdesc">Descripción</label>
          <input id="cdesc" [(ngModel)]="collection.description" />
        </div>
      </div>
      <br />
      <button class="btn-primary" (click)="addCollection()">Crear colección</button>

      <table style="margin-top: 1rem">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Productos</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (item of collections(); track item.id) {
            <tr>
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.description || '-' }}</td>
              <td>{{ item.product_ids.length }}</td>
              <td>
                <span class="badge" [class.ok]="item.is_active">
                  {{ item.is_active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td>
                <button class="btn" (click)="toggleCollection(item)">
                  {{ item.is_active ? 'Desactivar' : 'Activar' }}
                </button>
                <button class="btn-danger" (click)="removeCollection(item)">Eliminar</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>Nueva promoción</h3>
      <div class="grid-2">
        <div>
          <label for="pname">Nombre</label>
          <input id="pname" [(ngModel)]="promotion.name" />
        </div>
        <div>
          <label for="ptype">Tipo de descuento</label>
          <select id="ptype" [(ngModel)]="promotion.discount_type">
            <option value="percentage">Porcentaje</option>
            <option value="fixed">Monto fijo</option>
          </select>
        </div>
        <div>
          <label for="pvalue">Valor</label>
          <input id="pvalue" type="number" min="0" [(ngModel)]="promotion.discount_value" />
        </div>
        <div>
          <label for="pstart">Inicio</label>
          <input id="pstart" type="date" [(ngModel)]="promotion.start_date" />
        </div>
        <div>
          <label for="pend">Fin</label>
          <input id="pend" type="date" [(ngModel)]="promotion.end_date" />
        </div>
      </div>
      <br />
      <button class="btn-primary" (click)="addPromotion()">Crear promoción</button>

      <table style="margin-top: 1rem">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descuento</th>
            <th>Vigencia</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (item of promotions(); track item.id) {
            <tr>
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>
                {{ item.discount_value }}
                {{ item.discount_type === 'percentage' ? '%' : 'USD' }}
              </td>
              <td class="muted">{{ item.start_date || '-' }} → {{ item.end_date || '-' }}</td>
              <td>
                <span class="badge" [class.ok]="item.is_active">
                  {{ item.is_active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td>
                <button class="btn" (click)="togglePromotion(item)">
                  {{ item.is_active ? 'Desactivar' : 'Activar' }}
                </button>
                <button class="btn-danger" (click)="removePromotion(item)">Eliminar</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class MarketingPage {
  private readonly service = inject(MarketingService);

  readonly collections = signal<CollectionResponse[]>([]);
  readonly promotions = signal<PromotionResponse[]>([]);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  collection: CollectionCreate = { name: '', description: '', is_active: true };
  promotion: PromotionCreate = {
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    start_date: null,
    end_date: null,
    is_active: true
  };

  constructor() {
    this.loadCollections();
    this.loadPromotions();
  }

  private fail(err: Error): void {
    this.error.set(err.message);
    this.message.set(null);
  }

  loadCollections(): void {
    this.service.listCollections().subscribe({
      next: (d) => this.collections.set(d),
      error: (e: Error) => this.fail(e)
    });
  }

  loadPromotions(): void {
    this.service.listPromotions().subscribe({
      next: (d) => this.promotions.set(d),
      error: (e: Error) => this.fail(e)
    });
  }

  addCollection(): void {
    if (!this.collection.name.trim()) {
      this.fail(new Error('El nombre de la colección es obligatorio.'));
      return;
    }
    this.service.createCollection(this.collection).subscribe({
      next: () => {
        this.message.set('Colección creada.');
        this.error.set(null);
        this.collection = { name: '', description: '', is_active: true };
        this.loadCollections();
      },
      error: (e: Error) => this.fail(e)
    });
  }

  toggleCollection(item: CollectionResponse): void {
    this.service
      .updateCollection(item.id, {
        name: item.name,
        description: item.description,
        is_active: !item.is_active,
        product_ids: item.product_ids
      })
      .subscribe({
        next: () => this.loadCollections(),
        error: (e: Error) => this.fail(e)
      });
  }

  removeCollection(item: CollectionResponse): void {
    this.service.removeCollection(item.id).subscribe({
      next: () => this.loadCollections(),
      error: (e: Error) => this.fail(e)
    });
  }

  addPromotion(): void {
    if (!this.promotion.name.trim() || this.promotion.discount_value <= 0) {
      this.fail(new Error('Nombre y un valor de descuento mayor a 0 son obligatorios.'));
      return;
    }
    this.service.createPromotion(this.promotion).subscribe({
      next: () => {
        this.message.set('Promoción creada.');
        this.error.set(null);
        this.promotion = {
          name: '',
          description: '',
          discount_type: 'percentage',
          discount_value: 0,
          start_date: null,
          end_date: null,
          is_active: true
        };
        this.loadPromotions();
      },
      error: (e: Error) => this.fail(e)
    });
  }

  togglePromotion(item: PromotionResponse): void {
    this.service
      .updatePromotion(item.id, {
        name: item.name,
        description: item.description,
        discount_type: item.discount_type === 'fixed' ? 'fixed' : 'percentage',
        discount_value: item.discount_value,
        start_date: item.start_date,
        end_date: item.end_date,
        is_active: !item.is_active,
        product_ids: item.product_ids
      })
      .subscribe({
        next: () => this.loadPromotions(),
        error: (e: Error) => this.fail(e)
      });
  }

  removePromotion(item: PromotionResponse): void {
    this.service.removePromotion(item.id).subscribe({
      next: () => this.loadPromotions(),
      error: (e: Error) => this.fail(e)
    });
  }
}
