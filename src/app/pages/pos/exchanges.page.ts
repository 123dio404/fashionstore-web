import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommerceService } from '../../core/services/commerce.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { ProductsService } from '../../core/services/products.service';
import { ProductResponse, SaleResponse } from '../../models';

@Component({
  selector: 'app-exchanges-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="exchanges-container">
      <header class="page-header">
        <span class="eyebrow">Políticas Postventa (RN-06 / RF17)</span>
        <h1>Gestión de Cambio de Prendas</h1>
        <p class="subtitle">Registra cambios de prendas adquiridas en tienda dentro del plazo máximo de 30 días.</p>
      </header>

      <div class="main-grid">
        <!-- Formulario de Nuevo Cambio -->
        <div class="card exchange-form-card">
          <h2>Registrar Nuevo Cambio</h2>

          <div class="form-group">
            <label>ID de la Venta Original</label>
            <div class="input-with-btn">
              <input
                type="number"
                placeholder="Ej. 12"
                [(ngModel)]="saleIdInput"
                (keyup.enter)="searchSale()"
              />
              <button class="btn btn-secondary" (click)="searchSale()" [disabled]="searchingSale()">
                {{ searchingSale() ? 'Buscando...' : 'Buscar Venta' }}
              </button>
            </div>
          </div>

          <!-- Información de la Venta Consultada -->
          @if (selectedSale(); as sale) {
            <div class="sale-preview-card" [class.expired]="isSaleExpired(sale)">
              <div class="preview-header">
                <strong>Venta #{{ sale.id }}</strong>
                <span class="date">{{ sale.sale_date | date: 'medium' }}</span>
              </div>

              <div class="validation-banner" [class.valid]="!isSaleExpired(sale)" [class.invalid]="isSaleExpired(sale)">
                @if (!isSaleExpired(sale)) {
                  <span>✅ Venta dentro del plazo: <strong>{{ getElapsedDays(sale) }} días</strong> transcurridos (máx. 30 días).</span>
                } @else {
                  <span>⛔ Plazo de cambio vencido: <strong>{{ getElapsedDays(sale) }} días</strong> transcurridos (supera el límite de 30 días).</span>
                }
              </div>

              <!-- Selector de Prenda Devuelta -->
              <div class="form-group">
                <label>Prenda a Devolver (Comprada en esta venta):</label>
                <select [(ngModel)]="selectedReturnedVariantId" (change)="onReturnedVariantChange()">
                  <option [ngValue]="null">-- Seleccionar prenda a devolver --</option>
                  @for (item of sale.items; track item.id) {
                    <option [ngValue]="item.variant_id || item.stock_id">
                      {{ item.product_name || 'Prenda' }} (Cant: {{ item.quantity }}) — Bs. {{ item.unit_price }}
                    </option>
                  }
                </select>
              </div>

              <!-- Selector de Nueva Prenda de Cambio -->
              <div class="form-group">
                <label>Nueva Prenda de Cambio (Catálogo):</label>
                <select [(ngModel)]="selectedNewVariantId" (change)="onNewVariantChange()">
                  <option [ngValue]="null">-- Seleccionar nueva prenda --</option>
                  @for (prod of availableProducts(); track prod.id) {
                    @for (v of prod.variants; track v.id) {
                      <option [ngValue]="v.id">
                        {{ prod.name }} (Código: {{ v.codigo }}) — Bs. {{ v.price }}
                      </option>
                    }
                  }
                </select>
              </div>

              <!-- Diferencia de Precio y Motivo -->
              @if (returnedPrice !== null && newPrice !== null) {
                <div class="price-diff-card" [class.payable]="priceDifference > 0" [class.refundable]="priceDifference < 0">
                  <div class="diff-title">Ajuste de Precios:</div>
                  <div class="diff-details">
                    <div>Prenda Devuelta: Bs. {{ returnedPrice }}</div>
                    <div>Nueva Prenda: Bs. {{ newPrice }}</div>
                    <div class="diff-total">
                      Diferencia: <strong>Bs. {{ priceDifference }}</strong>
                      <span class="diff-note">
                        {{ priceDifference > 0 ? '(Cliente debe abonar)' : (priceDifference < 0 ? '(Saldo a favor del cliente)' : '(Sin diferencia)') }}
                      </span>
                    </div>
                  </div>
                </div>
              }

              <div class="form-group">
                <label>Motivo del Cambio:</label>
                <input
                  type="text"
                  placeholder="Ej. Cambio de talla M por L o preferencia de color"
                  [(ngModel)]="exchangeReason"
                />
              </div>

              <button
                class="btn btn-primary btn-block"
                [disabled]="isSaleExpired(sale) || !selectedReturnedVariantId || !selectedNewVariantId || processing()"
                (click)="submitExchange()"
              >
                {{ processing() ? 'Procesando Cambio...' : 'Confirmar Cambio de Prenda' }}
              </button>
            </div>
          }
        </div>

        <!-- Historial de Cambios Realizados -->
        <div class="card history-card">
          <h2>Historial de Cambios Recientes</h2>

          @if (exchanges().length === 0) {
            <p class="empty-text">No se han registrado cambios de prendas recientemente.</p>
          } @else {
            <div class="table-responsive">
              <table class="exchanges-table">
                <thead>
                  <tr>
                    <th>Comprobante</th>
                    <th>Venta Orig.</th>
                    <th>Prenda Devuelta</th>
                    <th>Nueva Prenda</th>
                    <th>Diferencia</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ex of exchanges(); track ex.id) {
                    <tr>
                      <td><span class="voucher-tag">{{ ex.voucher_number }}</span></td>
                      <td>#{{ ex.original_sale_id }}</td>
                      <td>{{ ex.returned_product_name || ('Variante #' + ex.returned_variant_id) }}</td>
                      <td>{{ ex.new_product_name || ('Variante #' + ex.new_variant_id) }}</td>
                      <td>
                        <strong [class.text-green]="ex.price_difference === 0" [class.text-amber]="ex.price_difference !== 0">
                          Bs. {{ ex.price_difference }}
                        </strong>
                      </td>
                      <td>{{ ex.created_at | date: 'short' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .exchanges-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    .page-header { margin-bottom: 2rem; }
    .eyebrow {
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      color: #e05a47;
      font-weight: 700;
    }
    h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #1e1b4b;
      margin: 0.25rem 0;
    }
    .subtitle { color: #6b7280; font-size: 0.95rem; }
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    @media (max-width: 900px) {
      .main-grid { grid-template-columns: 1fr; }
    }
    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 1.75rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .card h2 {
      font-size: 1.25rem;
      color: #1e1b4b;
      margin-top: 0;
      margin-bottom: 1.25rem;
    }
    .form-group {
      margin-bottom: 1.2rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.4rem;
    }
    .form-group input, .form-group select {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #1f2937;
    }
    .input-with-btn {
      display: flex;
      gap: 0.5rem;
    }
    .btn {
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary { background: #e05a47; color: #ffffff; }
    .btn-primary:hover:not(:disabled) { background: #c84533; }
    .btn-primary:disabled { background: #d1d5db; cursor: not-allowed; }
    .btn-secondary { background: #4f46e5; color: #ffffff; }
    .btn-block { width: 100%; margin-top: 1rem; }
    .sale-preview-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.25rem;
      margin-top: 1rem;
    }
    .preview-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .validation-banner {
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    .validation-banner.valid {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .validation-banner.invalid {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .price-diff-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 0.85rem;
      margin-bottom: 1rem;
    }
    .diff-title { font-weight: 700; font-size: 0.85rem; color: #374151; margin-bottom: 0.25rem; }
    .diff-details { font-size: 0.85rem; color: #4b5563; }
    .diff-total { margin-top: 0.5rem; font-size: 0.95rem; color: #111827; }
    .diff-note { font-size: 0.8rem; color: #6b7280; margin-left: 0.4rem; }
    .table-responsive { overflow-x: auto; }
    .exchanges-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .exchanges-table th {
      background: #f3f4f6;
      text-align: left;
      padding: 0.6rem 0.75rem;
      color: #374151;
      font-weight: 700;
    }
    .exchanges-table td {
      padding: 0.65rem 0.75rem;
      border-bottom: 1px solid #f3f4f6;
      color: #1f2937;
    }
    .voucher-tag {
      background: #e0e7ff;
      color: #4338ca;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
    }
    .text-green { color: #16a34a; }
    .text-amber { color: #d97706; }
    .empty-text { color: #9ca3af; text-align: center; padding: 2rem 0; }
  `]
})
export class ExchangesPage implements OnInit {
  private readonly commerce = inject(CommerceService);
  private readonly productsService = inject(ProductsService);
  private readonly notifs = inject(NotificationsService);

  saleIdInput: number | null = null;
  searchingSale = signal(false);
  selectedSale = signal<SaleResponse | null>(null);
  availableProducts = signal<ProductResponse[]>([]);
  exchanges = signal<any[]>([]);
  processing = signal(false);

  selectedReturnedVariantId: number | null = null;
  selectedNewVariantId: number | null = null;
  returnedPrice: number | null = null;
  newPrice: number | null = null;
  priceDifference = 0;
  exchangeReason = '';

  ngOnInit(): void {
    this.loadCatalog();
    this.loadExchanges();
  }

  loadCatalog(): void {
    this.productsService.list().subscribe({
      next: (products) => this.availableProducts.set(products),
      error: () => {}
    });
  }

  loadExchanges(): void {
    this.commerce.listExchanges().subscribe({
      next: (data) => this.exchanges.set(data),
      error: () => {}
    });
  }

  searchSale(): void {
    if (!this.saleIdInput) return;
    this.searchingSale.set(true);
    this.commerce.getSale(this.saleIdInput).subscribe({
      next: (sale) => {
        this.selectedSale.set(sale);
        this.selectedReturnedVariantId = null;
        this.selectedNewVariantId = null;
        this.returnedPrice = null;
        this.newPrice = null;
        this.priceDifference = 0;
        this.searchingSale.set(false);
      },
      error: (err) => {
        this.notifs.error('Venta no encontrada: ' + (err.error?.detail || err.message));
        this.searchingSale.set(false);
      }
    });
  }

  getElapsedDays(sale: SaleResponse): number {
    const saleDate = new Date(sale.sale_date).getTime();
    const now = Date.now();
    return Math.floor((now - saleDate) / (1000 * 60 * 60 * 24));
  }

  isSaleExpired(sale: SaleResponse): boolean {
    return this.getElapsedDays(sale) > 30;
  }

  onReturnedVariantChange(): void {
    const sale = this.selectedSale();
    if (!sale || !this.selectedReturnedVariantId) {
      this.returnedPrice = null;
      this.calculateDiff();
      return;
    }
    const item = sale.items.find(
      (i: any) => (i.variant_id || i.stock_id) === this.selectedReturnedVariantId
    );
    this.returnedPrice = item ? Number(item.unit_price) : null;
    this.calculateDiff();
  }

  onNewVariantChange(): void {
    if (!this.selectedNewVariantId) {
      this.newPrice = null;
      this.calculateDiff();
      return;
    }
    for (const p of this.availableProducts()) {
      for (const v of p.variants) {
        if (v.id === this.selectedNewVariantId) {
          this.newPrice = v.price;
          this.calculateDiff();
          return;
        }
      }
    }
  }

  calculateDiff(): void {
    if (this.returnedPrice !== null && this.newPrice !== null) {
      this.priceDifference = Math.round((this.newPrice - this.returnedPrice) * 100) / 100;
    } else {
      this.priceDifference = 0;
    }
  }

  submitExchange(): void {
    const sale = this.selectedSale();
    if (!sale || !this.selectedReturnedVariantId || !this.selectedNewVariantId) return;

    this.processing.set(true);
    this.commerce
      .createExchange({
        branch_id: sale.branch_id,
        original_sale_id: sale.id,
        returned_variant_id: this.selectedReturnedVariantId,
        new_variant_id: this.selectedNewVariantId,
        reason: this.exchangeReason || 'Cambio por satisfacción de prenda'
      })
      .subscribe({
        next: (res) => {
          this.notifs.success(`¡Cambio procesado con éxito! Comprobante: ${res.voucher_number}`);
          this.processing.set(false);
          this.selectedSale.set(null);
          this.saleIdInput = null;
          this.loadExchanges();
        },
        error: (err) => {
          this.notifs.error('Error al tramitar cambio: ' + (err.error?.detail || err.message));
          this.processing.set(false);
        }
      });
  }
}
