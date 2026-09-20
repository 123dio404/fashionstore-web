import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { ProductsService } from '../../core/services/products.service';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { UiDrawerComponent } from '../../shared/ui/drawer.component';
import { TabItem, UiTabsComponent } from '../../shared/ui/tabs.component';

type ParamType = 'category' | 'size' | 'color' | 'season';

interface ParamRow {
  id: number;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
}

const LABELS: Record<ParamType, string> = {
  category: 'Categoría',
  size: 'Talla',
  color: 'Color',
  season: 'Temporada'
};

/** CU06 — Gestionar parámetros de prendas: pestañas por entidad, tabla y drawer de alta/edición. */
@Component({
  selector: 'app-parameters-page',
  imports: [CommonModule, FormsModule, UiDrawerComponent, UiTabsComponent],
  templateUrl: './parameters.page.html'
})
export class ParametersPage {
  private readonly products = inject(ProductsService);
  private readonly confirm = inject(ConfirmService);

  readonly activeTab = signal<ParamType>('category');
  readonly categories = signal<ParamRow[]>([]);
  readonly sizes = signal<ParamRow[]>([]);
  readonly colors = signal<ParamRow[]>([]);
  readonly seasons = signal<ParamRow[]>([]);
  readonly drawerOpen = signal(false);
  readonly editing = signal<ParamRow | null>(null);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  form: { name: string; start_date: string | null; end_date: string | null } = {
    name: '',
    start_date: null,
    end_date: null
  };

  readonly tabs = computed<TabItem[]>(() => [
    { id: 'category', label: 'Categorías', count: this.categories().length },
    { id: 'size', label: 'Tallas', count: this.sizes().length },
    { id: 'color', label: 'Colores', count: this.colors().length },
    { id: 'season', label: 'Temporadas', count: this.seasons().length }
  ]);

  readonly current = computed<ParamRow[]>(() => {
    switch (this.activeTab()) {
      case 'category':
        return this.categories();
      case 'size':
        return this.sizes();
      case 'color':
        return this.colors();
      case 'season':
        return this.seasons();
    }
  });

  constructor() {
    this.reload();
  }

  singular(): string {
    return LABELS[this.activeTab()];
  }

  isSeason(): boolean {
    return this.activeTab() === 'season';
  }

  /** Una temporada está en curso si hoy cae dentro de su rango de fechas. */
  isActiveSeason(row: ParamRow): boolean {
    if (!row.start_date && !row.end_date) return true;
    const today = new Date().toISOString().slice(0, 10);
    const afterStart = !row.start_date || row.start_date <= today;
    const beforeEnd = !row.end_date || row.end_date >= today;
    return afterStart && beforeEnd;
  }

  onTab(id: string): void {
    this.activeTab.set(id as ParamType);
    this.message.set(null);
    this.error.set(null);
  }

  openCreate(): void {
    this.editing.set(null);
    this.form = { name: '', start_date: null, end_date: null };
    this.drawerOpen.set(true);
  }

  openEdit(row: ParamRow): void {
    this.editing.set(row);
    this.form = {
      name: row.name,
      start_date: row.start_date ?? null,
      end_date: row.end_date ?? null
    };
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editing.set(null);
  }

  save(): void {
    const name = this.form.name.trim();
    if (!name) {
      this.fail(new Error('El nombre es obligatorio.'));
      return;
    }

    const current = this.editing();
    if (current) {
      this.update(current.id, name).subscribe({
        next: () => {
          this.message.set('Registro actualizado.');
          this.error.set(null);
          this.closeDrawer();
          this.reload();
        },
        error: (err: Error) => this.fail(err)
      });
      return;
    }

    this.create(name).subscribe({
      next: () => {
        this.message.set('Registro creado.');
        this.error.set(null);
        this.closeDrawer();
        this.reload();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  remove(row: ParamRow): void {
    void this.confirm
      .ask({
        title: `Eliminar ${this.singular().toLowerCase()}`,
        message: `¿Eliminar "${row.name}"? Si está en uso por alguna prenda el sistema lo impedirá.`,
        confirmLabel: 'Sí, eliminar',
        danger: true
      })
      .then((confirmed) => {
        if (!confirmed) return;
        this.removeRequest(row.id).subscribe({
          next: () => {
            this.message.set('Registro eliminado.');
            this.reload();
          },
          error: (err: Error) => this.fail(err)
        });
      });
  }

  private reload(): void {
    this.products.listCategories().subscribe((data) => this.categories.set(data));
    this.products.listSizes().subscribe((data) => this.sizes.set(data));
    this.products.listColors().subscribe((data) => this.colors.set(data));
    this.products.listSeasons().subscribe((data) => this.seasons.set(data));
  }

  private create(name: string): Observable<unknown> {
    const payload = {
      name,
      start_date: this.form.start_date || null,
      end_date: this.form.end_date || null
    };
    switch (this.activeTab()) {
      case 'category':
        return this.products.createCategory({ name });
      case 'size':
        return this.products.createSize({ name });
      case 'color':
        return this.products.createColor({ name });
      case 'season':
        return this.products.createSeason(payload);
    }
  }

  private update(id: number, name: string): Observable<unknown> {
    const payload = {
      name,
      start_date: this.form.start_date || null,
      end_date: this.form.end_date || null
    };
    switch (this.activeTab()) {
      case 'category':
        return this.products.updateCategory(id, { name });
      case 'size':
        return this.products.updateSize(id, { name });
      case 'color':
        return this.products.updateColor(id, { name });
      case 'season':
        return this.products.updateSeason(id, payload);
    }
  }

  private removeRequest(id: number): Observable<void> {
    switch (this.activeTab()) {
      case 'category':
        return this.products.removeCategory(id);
      case 'size':
        return this.products.removeSize(id);
      case 'color':
        return this.products.removeColor(id);
      case 'season':
        return this.products.removeSeason(id);
    }
  }

  private fail(err: Error): void {
    this.error.set(err.message);
    this.message.set(null);
  }
}
