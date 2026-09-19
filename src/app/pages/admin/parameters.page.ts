import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { ProductsService } from '../../core/services/products.service';

type ParamType = 'category' | 'size' | 'color' | 'season';

interface ParamRow {
  id: number;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
}

@Component({
  selector: 'app-parameters-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Parámetros de prendas</h2>

    <div class="toolbar">
      <div class="field">
        <label for="type">Tipo</label>
        <select id="type" [ngModel]="type()" (ngModelChange)="type.set($event)">
          <option value="category">Categorías</option>
          <option value="size">Tallas</option>
          <option value="color">Colores</option>
          <option value="season">Temporadas</option>
        </select>
      </div>
      <div class="field">
        <label for="name">Nombre</label>
        <input id="name" [(ngModel)]="newName" />
      </div>
      @if (type() === 'season') {
        <div class="field">
          <label for="sd">Inicio</label>
          <input id="sd" type="date" [(ngModel)]="newStart" />
        </div>
        <div class="field">
          <label for="ed">Fin</label>
          <input id="ed" type="date" [(ngModel)]="newEnd" />
        </div>
      }
      <button class="btn-primary" (click)="add()">Agregar</button>
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (message()) {
      <p class="success">{{ message() }}</p>
    }

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            @if (type() === 'season') {
              <th>Inicio</th>
              <th>Fin</th>
            }
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (row of current(); track row.id) {
            <tr>
              <td>{{ row.id }}</td>
              <td><input [(ngModel)]="row.name" /></td>
              @if (type() === 'season') {
                <td><input type="date" [(ngModel)]="row.start_date" /></td>
                <td><input type="date" [(ngModel)]="row.end_date" /></td>
              }
              <td style="width: 12rem">
                <button class="btn" (click)="save(row)">Guardar</button>
                <button class="btn-danger" (click)="remove(row)">Eliminar</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class ParametersPage {
  private readonly products = inject(ProductsService);

  readonly type = signal<ParamType>('category');
  readonly categories = signal<ParamRow[]>([]);
  readonly sizes = signal<ParamRow[]>([]);
  readonly colors = signal<ParamRow[]>([]);
  readonly seasons = signal<ParamRow[]>([]);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  newName = '';
  newStart = '';
  newEnd = '';

  readonly current = computed<ParamRow[]>(() => {
    switch (this.type()) {
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

  private reload(): void {
    this.products.listCategories().subscribe((d) => this.categories.set(d));
    this.products.listSizes().subscribe((d) => this.sizes.set(d));
    this.products.listColors().subscribe((d) => this.colors.set(d));
    this.products.listSeasons().subscribe((d) => this.seasons.set(d));
  }

  private fail(err: Error): void {
    this.error.set(err.message);
    this.message.set(null);
  }

  add(): void {
    const name = this.newName.trim();
    if (!name) return;
    const payload = {
      name,
      start_date: this.newStart || null,
      end_date: this.newEnd || null
    };
    const request$: Observable<unknown> =
      this.type() === 'category'
        ? this.products.createCategory({ name })
        : this.type() === 'size'
          ? this.products.createSize({ name })
          : this.type() === 'color'
            ? this.products.createColor({ name })
            : this.products.createSeason(payload);

    request$.subscribe({
      next: () => {
        this.newName = '';
        this.newStart = '';
        this.newEnd = '';
        this.message.set('Registro creado.');
        this.error.set(null);
        this.reload();
      },
      error: (e: Error) => this.fail(e)
    });
  }

  save(row: ParamRow): void {
    const type = this.type();
    const done = { next: () => this.message.set('Registro actualizado.') };
    if (type === 'category') {
      this.products.updateCategory(row.id, { name: row.name }).subscribe({ ...done, error: (e: Error) => this.fail(e) });
    } else if (type === 'size') {
      this.products.updateSize(row.id, { name: row.name }).subscribe({ ...done, error: (e: Error) => this.fail(e) });
    } else if (type === 'color') {
      this.products.updateColor(row.id, { name: row.name }).subscribe({ ...done, error: (e: Error) => this.fail(e) });
    } else {
      this.products
        .updateSeason(row.id, {
          name: row.name,
          start_date: row.start_date ?? null,
          end_date: row.end_date ?? null
        })
        .subscribe({ ...done, error: (e: Error) => this.fail(e) });
    }
  }

  remove(row: ParamRow): void {
    const type = this.type();
    const request$ =
      type === 'category'
        ? this.products.removeCategory(row.id)
        : type === 'size'
          ? this.products.removeSize(row.id)
          : type === 'color'
            ? this.products.removeColor(row.id)
            : this.products.removeSeason(row.id);

    request$.subscribe({
      next: () => this.reload(),
      error: (e: Error) => this.fail(e)
    });
  }
}
