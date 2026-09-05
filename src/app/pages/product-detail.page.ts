import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { ProductResponse, VariantResponse } from '../models';

@Component({
  standalone: true, imports: [CommonModule, ReactiveFormsModule],
  template: `<main class="detail"><a href="/catalog">← Catálogo</a><p *ngIf="loading()">Cargando…</p>
  <ng-container *ngIf="product() as p"><h1>{{ p.name }}</h1><p>{{ p.description }}</p><p>SKU: {{ p.sku }} · {{ p.price | currency }}</p>
  <section class="card"><h2>Variantes</h2><p *ngIf="!p.variants.length">No hay variantes.</p><ul><li *ngFor="let v of p.variants">Talla {{v.size_id}} · Color {{v.color_id}} · {{v.barcode || 'sin código'}}</li></ul>
  <h3>Agregar variante</h3><form [formGroup]="form" (ngSubmit)="addVariant()"><input placeholder="ID de talla" formControlName="size_id"><input placeholder="ID de color" formControlName="color_id"><input placeholder="Código de barras (opcional)" formControlName="barcode"><button [disabled]="form.invalid || saving">{{saving ? 'Guardando…' : 'Agregar'}}</button></form></section></ng-container>
  <p class="error" *ngIf="error()">{{ error() }}</p></main>`,
  styles: [`.detail{max-width:850px;margin:48px auto;padding:0 24px;color:#1d2925}.detail>a{color:inherit}.detail h1{font:400 3rem Georgia,serif;margin:50px 0 12px}.card{margin-top:28px;background:#fff;padding:24px;box-shadow:0 8px 28px #1d292510}form{display:flex;gap:10px;flex-wrap:wrap}input{padding:10px;border:1px solid #c8d0c9}button{padding:10px 15px;background:#1d2925;color:white;border:0}.error{color:#9b3e29}`]
})
export class ProductDetailPage {
  private readonly api = inject(ApiService); private readonly route = inject(ActivatedRoute); private readonly fb = inject(FormBuilder);
  readonly product = signal<ProductResponse | null>(null); readonly loading = signal(true); readonly error = signal(''); saving = false;
  readonly form = this.fb.nonNullable.group({ size_id: ['', Validators.required], color_id: ['', Validators.required], barcode: [''] });
  constructor() { this.load(); }
  load(): void { const id = this.route.snapshot.paramMap.get('id'); if (!id) return; this.api.get<ProductResponse>(`products/${id}`).subscribe({ next: p => { this.product.set(p); this.loading.set(false); }, error: () => { this.error.set('No se pudo cargar el producto.'); this.loading.set(false); } }); }
  addVariant(): void { const id = this.route.snapshot.paramMap.get('id'); if (!id || this.form.invalid) return; this.saving = true; this.api.create<VariantResponse>(`products/${id}/variants`, this.form.getRawValue()).subscribe({ next: () => { this.form.reset(); this.saving = false; this.load(); }, error: () => { this.error.set('No se pudo crear la variante.'); this.saving = false; } }); }
}
