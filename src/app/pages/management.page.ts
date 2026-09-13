import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../core/services/api.service';
import { Role } from '../models';

type FieldType = 'text' | 'number' | 'email' | 'select' | 'bool' | 'textarea' | 'password';

interface Field {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  resource?: string;
  options?: string[];
  placeholder?: string;
}

interface ModuleConfig {
  title: string;
  resource: string;
  fields: Field[];
  identifier: string;
}

const MODULES: Record<string, ModuleConfig> = {
  categories: {
    title: 'Categorías',
    resource: 'parameters/categories',
    identifier: 'name',
    fields: [{ name: 'name', label: 'Nombre', required: true }]
  },
  seasons: {
    title: 'Temporadas',
    resource: 'parameters/seasons',
    identifier: 'name',
    fields: [{ name: 'name', label: 'Nombre', required: true }]
  },
  sizes: {
    title: 'Tallas',
    resource: 'parameters/sizes',
    identifier: 'name',
    fields: [{ name: 'name', label: 'Nombre', required: true }]
  },
  colors: {
    title: 'Colores',
    resource: 'parameters/colors',
    identifier: 'name',
    fields: [{ name: 'name', label: 'Nombre', required: true }]
  },
  cities: {
    title: 'Ciudades',
    resource: 'cities',
    identifier: 'name',
    fields: [{ name: 'name', label: 'Nombre', required: true }]
  },
  branches: {
    title: 'Sucursales',
    resource: 'branches',
    identifier: 'name',
    fields: [
      { name: 'name', label: 'Nombre', required: true },
      { name: 'city_id', label: 'Ciudad', type: 'select', resource: 'cities', required: true },
      { name: 'address', label: 'Dirección', required: true },
      { name: 'is_active', label: 'Activa', type: 'bool' }
    ]
  },
  suppliers: {
    title: 'Proveedores',
    resource: 'suppliers',
    identifier: 'name',
    fields: [
      { name: 'name', label: 'Nombre', required: true },
      { name: 'tax_id', label: 'CI/RUC', required: true },
      { name: 'contact_name', label: 'Contacto' },
      { name: 'email', label: 'Correo', type: 'email' },
      { name: 'phone', label: 'Teléfono' },
      { name: 'address', label: 'Dirección' },
      { name: 'notes', label: 'Notas', type: 'textarea' }
    ]
  },
  products: {
    title: 'Productos',
    resource: 'products',
    identifier: 'name',
    fields: [
      { name: 'name', label: 'Nombre', required: true },
      { name: 'category_id', label: 'Categoría', type: 'select', resource: 'parameters/categories', required: true },
      { name: 'brand', label: 'Marca' },
      { name: 'price', label: 'Precio', type: 'number', required: true },
      { name: 'is_active', label: 'Activo', type: 'bool' }
    ]
  },
  users: {
    title: 'Usuarios',
    resource: 'users',
    identifier: 'email',
    fields: [
      { name: 'full_name', label: 'Nombre completo', required: true },
      { name: 'email', label: 'Correo', type: 'email', required: true },
      { name: 'password', label: 'Contraseña', type: 'password', placeholder: 'Solo en creación' },
      { name: 'role', label: 'Rol', type: 'select', options: Object.values(Role) },
      { name: 'is_active', label: 'Activo', type: 'bool' }
    ]
  }
};

type Row = Record<string, unknown>;

interface OptionValue {
  id: string | number;
  name: string;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="container page">
      <div class="page-head">
        <p class="eyebrow">Administración</p>
        <h1 class="page-title">{{ config.title }}</h1>
        <p class="page-lead">Administra los registros de «{{ config.title }}».</p>
      </div>

      <a class="btn btn-ghost btn-sm mb-2" routerLink="/admin">← Volver al panel</a>

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }
      @if (message()) {
        <div class="alert alert-success">{{ message() }}</div>
      }

      <section class="card">
        <div class="card-head">
          <h3>{{ editingId() ? 'Editar registro' : 'Agregar registro' }}</h3>
          @if (editingId()) {
            <button class="btn btn-ghost btn-sm" type="button" (click)="cancelEdit()">Cancelar edición</button>
          }
        </div>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="form-grid">
            @for (field of config.fields; track field.name) {
              <div class="form-field" [class.full]="field.type === 'textarea'">
                <label>{{ field.label }}</label>
                @if (field.type === 'select') {
                  <select [formControlName]="field.name" [required]="!!field.required">
                    <option value="">—</option>
                    @for (opt of optionsFor(field); track opt.id) {
                      <option [value]="opt.id">{{ opt.name }}</option>
                    }
                  </select>
                } @else if (field.type === 'bool') {
                  <input type="checkbox" [formControlName]="field.name" />
                } @else if (field.type === 'textarea') {
                  <textarea [formControlName]="field.name" [placeholder]="field.placeholder ?? ''"></textarea>
                } @else {
                  <input
                    [type]="field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'"
                    [formControlName]="field.name"
                    [placeholder]="field.placeholder ?? ''"
                    [required]="!!field.required"
                    [step]="field.type === 'number' ? '0.01' : undefined"
                  />
                }
              </div>
            }
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Guardando…' : editingId() ? 'Actualizar' : 'Guardar' }}
            </button>
          </div>
        </form>
      </section>

      @if (config.title === 'Productos') {
        <section class="card mt-2">
          <h3>Agregar variante</h3>
          <form [formGroup]="variantForm" (ngSubmit)="addVariant()">
            <div class="form-grid">
              <div class="form-field">
                <label>Producto</label>
                <select formControlName="product_id">
                  <option value="">—</option>
                  @for (p of productOptions(); track p.id) {
                    <option [value]="p.id">{{ p.name }}</option>
                  }
                </select>
              </div>
              <div class="form-field">
                <label>Talla</label>
                <select formControlName="size_id">
                  <option value="">—</option>
                  @for (opt of sizesOptions(); track opt.id) {
                    <option [value]="opt.id">{{ opt.name }}</option>
                  }
                </select>
              </div>
              <div class="form-field">
                <label>Color</label>
                <select formControlName="color_id">
                  <option value="">—</option>
                  @for (opt of colorsOptions(); track opt.id) {
                    <option [value]="opt.id">{{ opt.name }}</option>
                  }
                </select>
              </div>
              <div class="form-field">
                <label>Código</label>
                <input type="text" formControlName="codigo" placeholder="Ej. VEST-NEG-S" />
              </div>
              <div class="form-field">
                <label>Precio (opcional)</label>
                <input type="number" formControlName="price" step="0.01" />
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary btn-sm" type="submit" [disabled]="variantForm.invalid || saving()">
                Agregar variante
              </button>
            </div>
          </form>
          @if (variantMessage()) {
            <div class="alert alert-success mt-1">{{ variantMessage() }}</div>
          }
        </section>
      }

      <section class="card mt-2">
        <div class="card-head">
          <h3>Registros</h3>
          <button class="btn btn-ghost btn-sm" type="button" (click)="load()">Actualizar</button>
        </div>

        @if (loading()) {
          <div class="loading-row"><span class="spinner"></span> Cargando…</div>
        }
        @if (!loading() && !items().length) {
          <div class="empty"><h3>Sin registros</h3><p>Todavía no hay registros.</p></div>
        }
        @if (!loading() && items().length) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Información</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items(); track indexOf(item)) {
                  <tr>
                    <td class="strong">{{ displayName(item) }}</td>
                    <td class="small muted truncate" style="max-width:340px">{{ summary(item) }}</td>
                    <td>
                      <div class="table-actions justify-end">
                        <button class="btn btn-outline btn-sm" type="button" (click)="edit(item)">Editar</button>
                        <button class="btn btn-danger btn-sm" type="button" (click)="remove(item)">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .justify-end { justify-content: flex-end; }
  `]
})
export class ManagementPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly config = MODULES[this.route.snapshot.paramMap.get('module') ?? ''] ?? MODULES['categories'];
  readonly items = signal<Row[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly editingId = signal<number | null>(null);
  readonly variantMessage = signal('');

  readonly productOptions = signal<OptionValue[]>([]);
  readonly sizesOptions = signal<OptionValue[]>([]);
  readonly colorsOptions = signal<OptionValue[]>([]);
  private readonly resourceOptions = signal<Record<string, OptionValue[]>>({});

  readonly form = new FormGroup(
    Object.fromEntries(
      this.config.fields.map((field) => [
        field.name,
        new FormControl(
          field.type === 'bool' ? true : '',
          field.required ? Validators.required : []
        )
      ])
    )
  );

  readonly variantForm = new FormGroup({
    product_id: new FormControl<number | null>(null, Validators.required),
    size_id: new FormControl<number | null>(null, Validators.required),
    color_id: new FormControl<number | null>(null, Validators.required),
    codigo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    price: new FormControl<number | null>(null)
  });

  constructor() {
    this.load();
    this.loadSelectOptions();
    if (this.config.title === 'Productos') {
      this.api.list<{ id: number; name: string }>('products').subscribe({
        next: (v) => this.productOptions.set(v)
      });
      this.api.list<OptionValue>('parameters/sizes').subscribe({ next: (v) => this.sizesOptions.set(v) });
      this.api.list<OptionValue>('parameters/colors').subscribe({ next: (v) => this.colorsOptions.set(v) });
    }
  }

  private loadSelectOptions(): void {
    const resources = new Set<string>();
    this.config.fields.forEach((f) => f.resource && resources.add(f.resource));
    resources.forEach((resource) => {
      this.api.list<OptionValue>(resource).subscribe({
        next: (v) =>
          this.resourceOptions.update((map) => ({ ...map, [resource]: v }))
      });
    });
  }

  optionsFor(field: Field): OptionValue[] {
    if (field.options) {
      return field.options.map((name) => ({ id: name, name }));
    }
    return this.resourceOptions()[field.resource ?? ''] ?? [];
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.list<Row>(this.config.resource).subscribe({
      next: (v) => {
        this.items.set(v);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la información.');
        this.loading.set(false);
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.message.set('');

    const raw = this.form.getRawValue();
    const payload: Record<string, unknown> = {};
    this.config.fields.forEach((field) => {
      const value = raw[field.name];
      if (field.type === 'number') {
        payload[field.name] = value === '' ? undefined : Number(value);
      } else if (field.type === 'bool') {
        payload[field.name] = Boolean(value);
      } else {
        payload[field.name] = value;
      }
    });

    const id = this.editingId();
    const request =
      id !== null
        ? this.api.update(this.config.resource, id, payload)
        : this.api.create(this.config.resource, payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set('Registro guardado.');
        this.cancelEdit();
        this.load();
      },
      error: (e: Error) => {
        this.saving.set(false);
        this.error.set(e.message || 'No se pudo guardar el registro.');
      }
    });
  }

  edit(item: Row): void {
    this.editingId.set(Number(item['id']));
    this.form.patchValue(item as Partial<typeof this.form.value>);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset(
      Object.fromEntries(this.config.fields.map((f) => [f.name, f.type === 'bool' ? true : '']))
    );
  }

  remove(item: Row): void {
    const label = this.displayName(item);
    if (!confirm(`¿Eliminar «${label}»?`)) { return; }
    this.error.set('');
    this.api.remove(this.config.resource, String(item['id'])).subscribe({
      next: () => {
        this.message.set('Registro eliminado.');
        this.load();
      },
      error: () => this.error.set('No se pudo eliminar el registro.')
    });
  }

  addVariant(): void {
    if (this.variantForm.invalid) { return; }
    const raw = this.variantForm.getRawValue();
    const productId = Number(raw.product_id);
    this.api
      .create(`products/${productId}/variants`, {
        size_id: Number(raw.size_id),
        color_id: Number(raw.color_id),
        codigo: raw.codigo,
        price: raw.price === null ? undefined : Number(raw.price)
      })
      .subscribe({
        next: () => {
          this.variantMessage.set('Variante agregada correctamente.');
          this.variantForm.reset();
        },
        error: (e: Error) => {
          this.variantMessage.set('');
          this.error.set(e.message || 'No se pudo agregar la variante.');
        }
      });
  }

  displayName(item: Row): string {
    const value = item[this.config.identifier];
    return typeof value === 'string' ? value : `#${item['id']}`;
  }

  summary(item: Row): string {
    return Object.entries(item)
      .filter(([k]) => !['id', this.config.identifier, 'password_hash', 'created_at'].includes(k))
      .slice(0, 3)
      .map(([k, v]) => `${k.replaceAll('_', ' ')}: ${v ?? '—'}`)
      .join(' · ');
  }

  indexOf(item: Row): number {
    return Number(item['id'] ?? 0);
  }
}