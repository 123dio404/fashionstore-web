import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { StockResponse } from '../models';

@Component({
  standalone: true, imports: [CommonModule, ReactiveFormsModule],
  template: `<main class="admin-shell"><header><div><p class="eyebrow">Operaciones</p><h1>Inventario</h1></div><a href="/">FashionStore</a></header>
  <p class="error" *ngIf="error()">{{ error() }}</p><section class="card"><h2>Ajustar stock</h2><form [formGroup]="form" (ngSubmit)="adjust()"><div class="form-grid">
  <label>ID sucursal<input formControlName="branch_id"></label><label>ID variante<input formControlName="variant_id"></label><label>Cantidad<input type="number" formControlName="quantity"></label><label>Motivo<input formControlName="reason"></label></div>
  <button class="primary-button" [disabled]="form.invalid || saving">{{ saving ? 'Guardando…' : 'Registrar ajuste' }}</button></form></section>
  <section class="card"><h2>Transferir entre sucursales</h2><form [formGroup]="transferForm" (ngSubmit)="transfer()"><div class="form-grid">
  <label>Variante<input formControlName="variant_id"></label><label>Origen<input formControlName="source_branch_id"></label><label>Destino<input formControlName="destination_branch_id"></label><label>Cantidad<input type="number" formControlName="quantity"></label><label>Motivo<input formControlName="reason"></label></div>
  <button class="primary-button" [disabled]="transferForm.invalid || saving">{{ saving ? 'Guardando…' : 'Registrar transferencia' }}</button></form></section>
  <section class="card"><div class="section-title"><h2>Stock actual</h2><button class="link-button" (click)="load()">Actualizar</button></div><p *ngIf="loading()">Cargando…</p>
  <div class="table-wrap" *ngIf="stock().length"><table><thead><tr><th>Sucursal</th><th>Variante</th><th>Físico</th><th>Reservado</th><th>Disponible</th></tr></thead><tbody><tr *ngFor="let s of stock()"><td>{{s.branch_id}}</td><td>{{s.variant_id}}</td><td>{{s.physical_stock}}</td><td>{{s.reserved_stock}}</td><td>{{s.available_stock}}</td></tr></tbody></table></div><p *ngIf="!loading()&&!stock().length">No hay existencias.</p></section>
  <section class="card"><h2>Movimientos recientes</h2><p *ngIf="!movements().length">No hay movimientos.</p><table *ngIf="movements().length"><tr><th>Tipo</th><th>Variante</th><th>Cantidad</th><th>Fecha</th></tr><tr *ngFor="let m of movements()"><td>{{m['movement_type']}}</td><td>{{m['variant_id']}}</td><td>{{m['quantity']}}</td><td>{{m['created_at']}}</td></tr></table></section></main>`,
  styles: [`.admin-shell{max-width:1100px;margin:auto;padding:32px 24px;color:#1d2925}.admin-shell header,.section-title{display:flex;justify-content:space-between;align-items:center}.admin-shell header a{color:inherit}.eyebrow{color:#bb5a3c;text-transform:uppercase;letter-spacing:.16em;font-size:.72rem;font-weight:700}h1{font:400 3rem Georgia,serif;margin:5px 0 28px}.card{background:#fff;padding:24px;margin:20px 0;box-shadow:0 8px 28px #1d292510}.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:20px}label{display:grid;gap:6px;font-size:.8rem;font-weight:700}input{padding:11px;border:1px solid #c8d0c9;font:inherit}.primary-button{padding:12px 18px;background:#1d2925;color:#fff;border:0}.link-button{background:none;border:0;color:#bb5a3c;font-weight:700}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px 8px;border-bottom:1px solid #e5e9e5;font-size:.85rem}.error{padding:12px;background:#f9e5df;color:#9b3e29}`]
})
export class InventoryPage {
  private readonly api = inject(ApiService); private readonly fb = inject(FormBuilder); readonly stock = signal<StockResponse[]>([]); readonly movements = signal<ReadonlyArray<Record<string, unknown>>>([]); readonly loading = signal(true); readonly error = signal(''); saving = false;
  readonly form = this.fb.nonNullable.group({ branch_id: ['', Validators.required], variant_id: ['', Validators.required], quantity: [0, Validators.required], reason: [''] });
  readonly transferForm = this.fb.nonNullable.group({ variant_id: ['', Validators.required], source_branch_id: ['', Validators.required], destination_branch_id: ['', Validators.required], quantity: [0, Validators.required], reason: [''] });
  constructor() { this.load(); }
  load(): void { this.loading.set(true); this.api.list<StockResponse>('inventory/stock').subscribe({ next: v => { this.stock.set(v); this.loading.set(false); }, error: () => { this.error.set('No se pudo cargar el inventario.'); this.loading.set(false); } }); this.api.list<Record<string, unknown>>('inventory/movements').subscribe({ next: v => this.movements.set(v) }); }
  adjust(): void { if (this.form.invalid) return; this.saving = true; this.api.create('inventory/movements/adjustment', this.form.getRawValue()).subscribe({ next: () => { this.saving = false; this.form.reset({ quantity: 0 }); this.load(); }, error: () => { this.error.set('No se pudo registrar el ajuste.'); this.saving = false; } }); }
  transfer(): void { if (this.transferForm.invalid) return; this.saving = true; this.api.create('inventory/transfers', this.transferForm.getRawValue()).subscribe({ next: () => { this.saving = false; this.transferForm.reset({ quantity: 0 }); this.load(); }, error: () => { this.error.set('No se pudo registrar la transferencia.'); this.saving = false; } }); }
}
