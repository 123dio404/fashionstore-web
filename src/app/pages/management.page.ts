import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/services/api.service';

type Field = { name: string; label: string; type?: string; required?: boolean };
const CONFIG: Record<string, { title: string; resource: string; fields: Field[] }> = {
  products: { title: 'Productos', resource: 'products', fields: [
    { name: 'name', label: 'Nombre', required: true }, { name: 'sku', label: 'SKU', required: true },
    { name: 'category_id', label: 'ID de categoría', required: true }, { name: 'price', label: 'Precio', type: 'number', required: true },
    { name: 'description', label: 'Descripción' }
  ]},
  users: { title: 'Usuarios', resource: 'users', fields: [
    { name: 'full_name', label: 'Nombre', required: true }, { name: 'email', label: 'Correo', type: 'email', required: true },
    { name: 'password', label: 'Contraseña', type: 'password', required: true }, { name: 'role', label: 'Rol' }
  ]},
  branches: { title: 'Sucursales', resource: 'branches', fields: [
    { name: 'name', label: 'Nombre', required: true }, { name: 'city_id', label: 'ID de ciudad', required: true },
    { name: 'address', label: 'Dirección', required: true }, { name: 'fitting_rooms', label: 'Probadores', type: 'number' }
  ]},
  suppliers: { title: 'Proveedores', resource: 'suppliers', fields: [
    { name: 'name', label: 'Nombre', required: true }, { name: 'tax_id', label: 'CI', required: true },
    { name: 'contact_name', label: 'Contacto' }, { name: 'email', label: 'Correo', type: 'email' }, { name: 'phone', label: 'Teléfono' }
  ]},
  categories: { title: 'Categorías', resource: 'parameters/categories', fields: [
    { name: 'name', label: 'Nombre', required: true }, { name: 'description', label: 'Descripción' }
  ]},
  seasons: { title: 'Temporadas', resource: 'parameters/seasons', fields: [{ name: 'name', label: 'Nombre', required: true }] },
  sizes: { title: 'Tallas', resource: 'parameters/sizes', fields: [{ name: 'name', label: 'Nombre', required: true }] },
  colors: { title: 'Colores', resource: 'parameters/colors', fields: [
    { name: 'name', label: 'Nombre', required: true }, { name: 'hex_code', label: 'Color', type: 'color', required: true }
  ]},
  cities: { title: 'Ciudades', resource: 'cities', fields: [
    { name: 'name', label: 'Nombre', required: true }, { name: 'country', label: 'País' }
  ]}
};
type Row = Record<string, unknown>;

@Component({
  standalone: true, imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="admin-shell">
      <header class="admin-header"><div><p class="eyebrow">Administración</p><h1>{{ config.title }}</h1></div>
        <a href="/" class="back-link">FashionStore</a></header>
      <p class="error" *ngIf="error()">{{ error() }}</p>
      <section class="card form-card"><h2>{{ editingId() ? 'Editar registro' : 'Agregar registro' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()"><div class="form-grid">
          <label *ngFor="let field of config.fields">{{ field.label }}
            <input [type]="field.type || 'text'" [formControlName]="field.name" [required]="!!field.required" />
          </label>
        </div><button class="primary-button" type="submit" [disabled]="form.invalid || saving()">{{ saving() ? 'Guardando…' : (editingId() ? 'Actualizar' : 'Guardar') }}</button>
        <button *ngIf="editingId()" class="link-button cancel-button" type="button" (click)="cancelEdit()">Cancelar</button></form>
      </section>
      <section class="card"><div class="section-title"><h2>Registros</h2><button type="button" class="link-button" (click)="load()">Actualizar</button></div>
        <p *ngIf="loading()">Cargando…</p><p *ngIf="!loading() && !items().length">No hay registros todavía.</p>
        <div class="table-wrap" *ngIf="items().length"><table><thead><tr><th>Nombre</th><th>Información</th><th></th></tr></thead>
          <tbody><tr *ngFor="let item of items()"><td>{{ item['name'] || item['full_name'] || item['email'] || '—' }}</td>
            <td>{{ summary(item) }}</td><td><button class="link-button" (click)="edit(item)">Editar</button>
              <button class="danger-button" (click)="remove(idOf(item))">Eliminar</button></td></tr></tbody>
        </table></div>
      </section>
    </main>`,
  styles: [`.admin-shell{max-width:1100px;margin:auto;padding:32px 24px 64px;color:#1d2925}.admin-header,.section-title{display:flex;justify-content:space-between;align-items:center;gap:20px}.eyebrow{color:#bb5a3c;text-transform:uppercase;letter-spacing:.16em;font-size:.72rem;font-weight:700}h1{font:400 3rem Georgia,serif;margin:4px 0 28px}.back-link{color:#1d2925;font-weight:700;text-decoration:none}.card{background:#fff;padding:24px;margin:20px 0;box-shadow:0 8px 28px #1d292510}h2{font:600 1.2rem Georgia,serif;margin:0 0 18px}.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:20px}label{display:grid;gap:6px;font-size:.8rem;font-weight:700}input{border:1px solid #c8d0c9;padding:11px;background:#fafbf9;font:inherit}button{border:0;cursor:pointer}.primary-button{padding:12px 18px;background:#1d2925;color:#fff}.link-button{background:none;color:#bb5a3c;font-weight:700}.danger-button{background:#f9e5df;color:#9b3e29;padding:7px 10px}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px 8px;border-bottom:1px solid #e5e9e5;font-size:.88rem}.error{background:#f9e5df;color:#9b3e29;padding:12px}`]
})
export class ManagementPage {
  private readonly api = inject(ApiService); private readonly route = inject(ActivatedRoute); private readonly fb = inject(FormBuilder);
  readonly config = CONFIG[this.route.snapshot.paramMap.get('module') || 'cities'] || CONFIG['cities'];
  readonly items = signal<Row[]>([]); readonly loading = signal(true); readonly saving = signal(false); readonly error = signal('');
  readonly editingId = signal<string | null>(null);
  readonly form = this.fb.group(Object.fromEntries(this.config.fields.map((f) => [f.name, ['', f.required ? Validators.required : []]])));
  constructor() { this.load(); }
  load(): void { this.loading.set(true); this.api.list<Row>(this.config.resource).subscribe({ next: (v) => { this.items.set(v); this.loading.set(false); }, error: () => { this.error.set('No se pudo cargar la información.'); this.loading.set(false); } }); }
  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const id = this.editingId();
    const request = id ? this.api.update(this.config.resource, id, this.form.getRawValue()) : this.api.create(this.config.resource, this.form.getRawValue());
    request.subscribe({ next: () => { this.cancelEdit(); this.saving.set(false); this.load(); }, error: () => { this.error.set('No se pudo guardar el registro.'); this.saving.set(false); } });
  }
  edit(item: Row): void { this.editingId.set(String(item['id'])); this.form.patchValue(item as Record<string, never>); }
  cancelEdit(): void { this.editingId.set(null); this.form.reset(); }
  idOf(item: Row): string { return `${item['id'] ?? ''}`; }
  remove(id: string): void { if (!confirm('¿Eliminar este registro?')) return; this.api.remove(this.config.resource, id).subscribe({ next: () => this.load(), error: () => this.error.set('No se pudo eliminar el registro.') }); }
  summary(item: Row): string { return Object.entries(item).filter(([k]) => !['id','name','full_name','email','created_at'].includes(k)).slice(0, 3).map(([k,v]) => `${k}: ${v ?? '—'}`).join(' · '); }
}
