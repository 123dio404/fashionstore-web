import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { demoImageFor, resolveProductImage } from '../../core/figma-data';
import { environment } from '../../../environments/environment';
import { ProductsService } from '../../core/services/products.service';
import {
  CategoryResponse,
  ColorResponse,
  ProductCreate,
  ProductResponse,
  ProductUpdate,
  SeasonResponse,
  SizeResponse,
  VariantCreate
} from '../../models';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { UiDrawerComponent } from '../../shared/ui/drawer.component';

const EMPTY_PRODUCT: ProductCreate = {
  name: '',
  brand: '',
  category_id: 0,
  season_id: null,
  price: 0,
  wholesale_price: null,
  wholesale_min_quantity: 3,
  material: null,
  secondary_color: null,
  is_clearance: false,
  discount_percentage: 0,
  image_url: null,
  model_3d_url: null,
  model_3d_format: null,
  technical_metadata: null,
  is_active: true
};

/** CU05 — Gestionar el catálogo de prendas: tabla con filtros y drawer con ficha técnica y variantes. */
@Component({
  selector: 'app-products-page',
  imports: [CommonModule, FormsModule, UiDrawerComponent],
  templateUrl: './products.page.html',
  styleUrl: './products.page.scss'
})
export class ProductsPage {
  private readonly service = inject(ProductsService);
  private readonly confirm = inject(ConfirmService);

  readonly products = signal<ProductResponse[]>([]);
  readonly categories = signal<CategoryResponse[]>([]);
  readonly seasons = signal<SeasonResponse[]>([]);
  readonly sizes = signal<SizeResponse[]>([]);
  readonly colors = signal<ColorResponse[]>([]);
  readonly drawerOpen = signal(false);
  readonly batchClearanceOpen = signal(false);
  readonly editing = signal<ProductResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  search = '';
  categoryFilter: number | null = null;
  seasonFilter: number | null = null;

  form: ProductCreate = { ...EMPTY_PRODUCT };
  variant: VariantCreate = { size_id: 0, color_id: 0, codigo: '', price: null };
  batchForm = {
    season_id: null as number | null,
    category_id: null as number | null,
    discount_percentage: 40,
    is_clearance: true
  };

  /** Filtro por nombre/marca, categoría y temporada. */
  get filtered(): ProductResponse[] {
    const term = this.search.trim().toLowerCase();
    return this.products().filter((product) => {
      if (this.categoryFilter !== null && product.category_id !== this.categoryFilter) return false;
      if (this.seasonFilter !== null && product.season_id !== this.seasonFilter) return false;
      if (!term) return true;
      return (
        product.name.toLowerCase().includes(term) ||
        (product.brand ?? '').toLowerCase().includes(term)
      );
    });
  }

  constructor() {
    this.load();
    this.service.listCategories().subscribe((data) => this.categories.set(data));
    this.service.listSeasons().subscribe((data) => this.seasons.set(data));
    this.service.listSizes().subscribe((data) => this.sizes.set(data));
    this.service.listColors().subscribe((data) => this.colors.set(data));
  }

  initial(product: ProductResponse): string {
    return (product.brand || product.name).charAt(0).toUpperCase();
  }

  readonly uploadingImage = signal(false);

  /** Imagen para la fila: utiliza la URL real si existe, o el resolver contextual por palabra clave. */
  readonly imageFor = (product: ProductResponse): string => {
    if (product.image_url && product.image_url.trim()) {
      if (product.image_url.startsWith('/uploads/')) {
        return `${environment.apiUrl.replace(/\/api\/v1\/?$/, '')}${product.image_url}`;
      }
      return product.image_url;
    }
    return resolveProductImage(product.name);
  };

  previewImageUrl(): string {
    if (this.form.image_url && this.form.image_url.trim()) {
      if (this.form.image_url.startsWith('/uploads/')) {
        return `${environment.apiUrl.replace(/\/api\/v1\/?$/, '')}${this.form.image_url}`;
      }
      return this.form.image_url;
    }
    if (this.form.name && this.form.name.trim()) {
      return resolveProductImage(this.form.name);
    }
    return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploadingImage.set(true);
    this.message.set(null);
    this.error.set(null);

    this.service.uploadImage(file).subscribe({
      next: (res) => {
        this.uploadingImage.set(false);
        this.form.image_url = res.url;
        this.message.set('Imagen subida con éxito.');
      },
      error: () => {
        // Fallback robusto a Data URL si el endpoint no responde
        const reader = new FileReader();
        reader.onload = () => {
          this.uploadingImage.set(false);
          this.form.image_url = reader.result as string;
          this.message.set('Imagen cargada.');
        };
        reader.onerror = () => {
          this.uploadingImage.set(false);
          this.fail(new Error('No se pudo leer el archivo de imagen.'));
        };
        reader.readAsDataURL(file);
      }
    });
  }

  removeImage(): void {
    this.form.image_url = null;
  }

  categoryName(product: ProductResponse): string {
    return (
      this.categories().find((category) => category.id === product.category_id)?.name ??
      'Sin categoría'
    );
  }

  seasonName(product: ProductResponse): string {
    if (product.season_id === null) return 'Sin temporada';
    return this.seasons().find((season) => season.id === product.season_id)?.name ?? '—';
  }

  sizeName(sizeId: number | null | undefined): string {
    if (sizeId === null || sizeId === undefined) return '—';
    return this.sizes().find((size) => size.id === sizeId)?.name ?? '—';
  }

  colorName(colorId: number | null | undefined): string {
    if (colorId === null || colorId === undefined) return '—';
    return this.colors().find((color) => color.id === colorId)?.name ?? '—';
  }

  load(after?: () => void): void {
    this.service.list().subscribe({
      next: (data) => {
        this.products.set(data);
        after?.();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form = { ...EMPTY_PRODUCT };
    this.message.set(null);
    this.error.set(null);
    this.drawerOpen.set(true);
  }

  openEdit(product: ProductResponse): void {
    this.editing.set(product);
    this.form = {
      name: product.name,
      brand: product.brand,
      category_id: product.category_id,
      season_id: product.season_id,
      price: product.price,
      wholesale_price: product.wholesale_price,
      wholesale_min_quantity: product.wholesale_min_quantity ?? 3,
      material: product.material,
      secondary_color: product.secondary_color,
      is_clearance: product.is_clearance ?? false,
      discount_percentage: product.discount_percentage ?? 0,
      image_url: product.image_url,
      model_3d_url: product.model_3d_url,
      model_3d_format: product.model_3d_format === 'gltf' ? 'gltf' : product.model_3d_format === 'glb' ? 'glb' : null,
      technical_metadata: product.technical_metadata,
      is_active: product.is_active
    };
    this.variant = { size_id: 0, color_id: 0, codigo: '', price: null };
    this.message.set(null);
    this.error.set(null);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editing.set(null);
  }

  openBatchClearance(): void {
    this.batchClearanceOpen.set(true);
    this.message.set(null);
    this.error.set(null);
  }

  closeBatchClearance(): void {
    this.batchClearanceOpen.set(false);
  }

  applyBatchClearance(): void {
    this.message.set(null);
    this.error.set(null);
    this.service.batchClearance(this.batchForm).subscribe({
      next: (res) => {
        this.message.set(`¡${res.message}! Se actualizaron ${res.updated_products_count} prendas.`);
        this.closeBatchClearance();
        this.load();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  save(): void {
    this.message.set(null);
    this.error.set(null);

    if (!this.form.name.trim() || !this.form.category_id) {
      this.fail(new Error('Nombre y categoría son obligatorios.'));
      return;
    }
    if (!this.form.model_3d_url) {
      this.form.model_3d_format = null;
    }

    const current = this.editing();
    if (!current) {
      this.service.create(this.form).subscribe({
        next: () => {
          this.message.set('Prenda creada con éxito.');
          this.closeDrawer();
          this.load();
        },
        error: (err: Error) => this.fail(err)
      });
      return;
    }

    const payload: ProductUpdate = {
      name: this.form.name,
      brand: this.form.brand,
      category_id: this.form.category_id,
      season_id: this.form.season_id,
      price: this.form.price,
      wholesale_price: this.form.wholesale_price,
      wholesale_min_quantity: this.form.wholesale_min_quantity,
      material: this.form.material,
      secondary_color: this.form.secondary_color,
      is_clearance: this.form.is_clearance,
      discount_percentage: this.form.discount_percentage,
      image_url: this.form.image_url,
      model_3d_url: this.form.model_3d_url,
      model_3d_format: this.form.model_3d_format,
      technical_metadata: this.form.technical_metadata,
      is_active: this.form.is_active
    };

    this.service.update(current.id, payload).subscribe({
      next: () => {
        this.message.set('Prenda actualizada.');
        this.load(() => {
          this.editing.set(this.products().find((item) => item.id === current.id) ?? null);
        });
      },
      error: (err: Error) => this.fail(err)
    });
  }

  addVariant(product: ProductResponse): void {
    this.message.set(null);
    this.error.set(null);

    if (!this.variant.size_id || !this.variant.color_id || !this.variant.codigo.trim()) {
      this.fail(new Error('Talla, color y código son obligatorios.'));
      return;
    }

    this.service
      .addVariant(product.id, {
        size_id: this.variant.size_id,
        color_id: this.variant.color_id,
        codigo: this.variant.codigo.trim(),
        price: this.variant.price
      })
      .subscribe({
        next: () => {
          this.message.set('Variante agregada.');
          this.variant = { size_id: 0, color_id: 0, codigo: '', price: null };
          this.load(() => {
            this.editing.set(this.products().find((item) => item.id === product.id) ?? null);
          });
        },
        error: (err: Error) => this.fail(err)
      });
  }

  remove(product: ProductResponse): void {
    void this.confirm
      .ask({
        title: 'Eliminar prenda',
        message: `¿Eliminar "${product.name}" del catálogo? Si tiene ventas asociadas el sistema lo impedirá.`,
        confirmLabel: 'Sí, eliminar',
        danger: true
      })
      .then((confirmed) => {
        if (!confirmed) return;
        this.service.remove(product.id).subscribe({
          next: () => {
            this.message.set('Prenda eliminada.');
            this.load();
          },
          error: (err: Error) => this.fail(err)
        });
      });
  }

  private fail(err: Error): void {
    this.error.set(err.message);
    this.message.set(null);
  }
}
