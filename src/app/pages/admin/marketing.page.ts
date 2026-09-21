import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MarketingService } from '../../core/services/marketing.service';
import {
  CollectionCreate,
  CollectionResponse,
  PromotionCreate,
  PromotionResponse
} from '../../models';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { UiDrawerComponent } from '../../shared/ui/drawer.component';
import { TabItem, UiTabsComponent } from '../../shared/ui/tabs.component';

const EMPTY_PROMOTION: PromotionCreate = {
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 0,
  start_date: null,
  end_date: null,
  is_active: true,
  product_ids: []
};

const EMPTY_COLLECTION: CollectionCreate = {
  name: '',
  description: '',
  is_active: true,
  product_ids: []
};

/** CU20 — Gestionar colecciones y promociones: pestañas, tablas y drawers por entidad. */
@Component({
  selector: 'app-marketing-page',
  imports: [CommonModule, FormsModule, UiDrawerComponent, UiTabsComponent],
  templateUrl: './marketing.page.html'
})
export class MarketingPage {
  private readonly service = inject(MarketingService);
  private readonly confirm = inject(ConfirmService);

  readonly activeTab = signal<'promotions' | 'collections'>('promotions');
  readonly promotions = signal<PromotionResponse[]>([]);
  readonly collections = signal<CollectionResponse[]>([]);
  readonly promotionDrawer = signal(false);
  readonly collectionDrawer = signal(false);
  readonly editingPromotion = signal<PromotionResponse | null>(null);
  readonly editingCollection = signal<CollectionResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly statusFilter = signal<'todas' | 'vigente' | 'programada' | 'expirada' | 'inactiva'>('todas');

  readonly statusOptions: Array<{ id: 'todas' | 'vigente' | 'programada' | 'expirada' | 'inactiva'; label: string }> = [
    { id: 'todas', label: 'Todas' },
    { id: 'vigente', label: 'Vigentes' },
    { id: 'programada', label: 'Programadas' },
    { id: 'expirada', label: 'Expiradas' },
    { id: 'inactiva', label: 'Inactivas' }
  ];

  promotionForm: PromotionCreate = { ...EMPTY_PROMOTION };
  collectionForm: CollectionCreate = { ...EMPTY_COLLECTION };
  productIds = '';

  readonly tabs = computed<TabItem[]>(() => [
    { id: 'promotions', label: 'Promociones', count: this.promotions().length },
    { id: 'collections', label: 'Colecciones', count: this.collections().length }
  ]);

  constructor() {
    this.load();
  }

  onTab(id: string): void {
    this.activeTab.set(id as 'promotions' | 'collections');
    this.message.set(null);
    this.error.set(null);
  }

  /** Una promoción está vigente si está activa y hoy cae dentro de su rango. */
  isCurrent(promotion: PromotionResponse): boolean {
    if (!promotion.is_active) return false;
    const today = new Date().toISOString().slice(0, 10);
    const afterStart = !promotion.start_date || promotion.start_date <= today;
    const beforeEnd = !promotion.end_date || promotion.end_date >= today;
    return afterStart && beforeEnd;
  }

  /** Estado derivado: vigente / programada / expirada / inactiva (normalización del prototipo). */
  promotionStatus(promotion: PromotionResponse): 'vigente' | 'programada' | 'expirada' | 'inactiva' {
    if (!promotion.is_active) return 'inactiva';
    const today = new Date().toISOString().slice(0, 10);
    if (promotion.end_date && promotion.end_date < today) return 'expirada';
    if (promotion.start_date && promotion.start_date > today) return 'programada';
    return 'vigente';
  }

  readonly filteredPromotions = computed(() => {
    const status = this.statusFilter();
    if (status === 'todas') return this.promotions();
    return this.promotions().filter((p) => this.promotionStatus(p) === status);
  });

  /** Métricas derivadas a nivel cliente (el backend no expone usos todavía). */
  readonly promoStats = computed(() => {
    const items = this.promotions();
    let vigente = 0;
    let programada = 0;
    let expirada = 0;
    let prendas = 0;
    for (const p of items) {
      const status = this.promotionStatus(p);
      if (status === 'vigente') vigente += 1;
      if (status === 'programada') programada += 1;
      if (status === 'expirada') expirada += 1;
      prendas += p.product_ids.length;
    }
    return { vigente, programada, expirada, prendas };
  });

  rangeLabel(promotion: PromotionResponse): string {
    if (!promotion.start_date && !promotion.end_date) return 'Sin fecha límite';
    if (promotion.start_date && promotion.end_date) {
      return `${promotion.start_date} → ${promotion.end_date}`;
    }
    return promotion.end_date ? `Hasta ${promotion.end_date}` : `Desde ${promotion.start_date}`;
  }

  statusLabel(promotion: PromotionResponse): string {
    return this.promotionStatus(promotion)[0].toUpperCase() + this.promotionStatus(promotion).slice(1);
  }

  statusBadge(promotion: PromotionResponse): string {
    switch (this.promotionStatus(promotion)) {
      case 'vigente':
        return 'ok';
      case 'programada':
        return 'info';
      case 'expirada':
        return 'neutral';
      default:
        return 'neutral';
    }
  }

  openPromotionCreate(): void {
    this.editingPromotion.set(null);
    this.promotionForm = { ...EMPTY_PROMOTION };
    this.productIds = '';
    this.promotionDrawer.set(true);
  }

  openPromotionEdit(promotion: PromotionResponse): void {
    this.editingPromotion.set(promotion);
    this.promotionForm = {
      name: promotion.name,
      description: promotion.description ?? '',
      discount_type: promotion.discount_type === 'fixed' ? 'fixed' : 'percentage',
      discount_value: promotion.discount_value,
      start_date: promotion.start_date,
      end_date: promotion.end_date,
      is_active: promotion.is_active,
      product_ids: promotion.product_ids
    };
    this.productIds = promotion.product_ids.join(', ');
    this.promotionDrawer.set(true);
  }

  savePromotion(): void {
    if (!this.promotionForm.name.trim() || this.promotionForm.discount_value <= 0) {
      this.fail(new Error('El nombre y un valor de descuento mayor a 0 son obligatorios.'));
      return;
    }

    const payload: PromotionCreate = { ...this.promotionForm, product_ids: this.parseIds() };
    const current = this.editingPromotion();
    const request$ = current
      ? this.service.updatePromotion(current.id, payload)
      : this.service.createPromotion(payload);

    request$.subscribe({
      next: () => {
        this.message.set(current ? 'Promoción actualizada.' : 'Promoción creada.');
        this.error.set(null);
        this.promotionDrawer.set(false);
        this.load();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  togglePromotion(promotion: PromotionResponse): void {
    this.service
      .updatePromotion(promotion.id, {
        name: promotion.name,
        description: promotion.description,
        discount_type: promotion.discount_type === 'fixed' ? 'fixed' : 'percentage',
        discount_value: promotion.discount_value,
        start_date: promotion.start_date,
        end_date: promotion.end_date,
        is_active: !promotion.is_active,
        product_ids: promotion.product_ids
      })
      .subscribe({
        next: () => {
          this.message.set(promotion.is_active ? 'Promoción desactivada.' : 'Promoción activada.');
          this.load();
        },
        error: (err: Error) => this.fail(err)
      });
  }

  removePromotion(promotion: PromotionResponse): void {
    void this.confirm
      .ask({
        title: 'Eliminar promoción',
        message: `¿Eliminar "${promotion.name}"? El catálogo dejará de reflejar el descuento.`,
        confirmLabel: 'Sí, eliminar',
        danger: true
      })
      .then((confirmed) => {
        if (!confirmed) return;
        this.service.removePromotion(promotion.id).subscribe({
          next: () => {
            this.message.set('Promoción eliminada.');
            this.load();
          },
          error: (err: Error) => this.fail(err)
        });
      });
  }

  // --- Colecciones ---
  openCollectionCreate(): void {
    this.editingCollection.set(null);
    this.collectionForm = { ...EMPTY_COLLECTION };
    this.productIds = '';
    this.collectionDrawer.set(true);
  }

  openCollectionEdit(collection: CollectionResponse): void {
    this.editingCollection.set(collection);
    this.collectionForm = {
      name: collection.name,
      description: collection.description ?? '',
      is_active: collection.is_active,
      product_ids: collection.product_ids
    };
    this.productIds = collection.product_ids.join(', ');
    this.collectionDrawer.set(true);
  }

  saveCollection(): void {
    if (!this.collectionForm.name.trim()) {
      this.fail(new Error('El nombre de la colección es obligatorio.'));
      return;
    }

    const payload: CollectionCreate = { ...this.collectionForm, product_ids: this.parseIds() };
    const current = this.editingCollection();
    const request$ = current
      ? this.service.updateCollection(current.id, payload)
      : this.service.createCollection(payload);

    request$.subscribe({
      next: () => {
        this.message.set(current ? 'Colección actualizada.' : 'Colección creada.');
        this.error.set(null);
        this.collectionDrawer.set(false);
        this.load();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  toggleCollection(collection: CollectionResponse): void {
    this.service
      .updateCollection(collection.id, {
        name: collection.name,
        description: collection.description,
        is_active: !collection.is_active,
        product_ids: collection.product_ids
      })
      .subscribe({
        next: () => {
          this.message.set(collection.is_active ? 'Colección desactivada.' : 'Colección activada.');
          this.load();
        },
        error: (err: Error) => this.fail(err)
      });
  }

  removeCollection(collection: CollectionResponse): void {
    void this.confirm
      .ask({
        title: 'Eliminar colección',
        message: `¿Eliminar "${collection.name}"? Las prendas no se borran, solo salen de la colección.`,
        confirmLabel: 'Sí, eliminar',
        danger: true
      })
      .then((confirmed) => {
        if (!confirmed) return;
        this.service.removeCollection(collection.id).subscribe({
          next: () => {
            this.message.set('Colección eliminada.');
            this.load();
          },
          error: (err: Error) => this.fail(err)
        });
      });
  }

  private parseIds(): number[] {
    return this.productIds
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);
  }

  private load(): void {
    this.service.listPromotions().subscribe({
      next: (data) => this.promotions.set(data),
      error: (err: Error) => this.fail(err)
    });
    this.service.listCollections().subscribe({
      next: (data) => this.collections.set(data),
      error: (err: Error) => this.fail(err)
    });
  }

  private fail(err: Error): void {
    this.error.set(err.message);
    this.message.set(null);
  }
}
