import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OfflineQueueItem, SyncBatchResponse } from '../../models';
import { AuthService } from './auth.service';
import { IndexedDbService } from './indexed-db.service';
import { NotificationsService } from './notifications.service';

/** Operación que viaja al endpoint `POST /sync/batch`. */
interface SyncOperationPayload {
  uuid: string;
  type: 'SALE' | 'RESERVATION';
  created_at: string;
  branch_id: number;
  client_id: number | null;
  total: number;
  payment_method: string;
  items: Array<{ stock_id: number; quantity: number; unit_price: number }>;
}

@Injectable({ providedIn: 'root' })
export class SyncManagerService {
  private readonly http = inject(HttpClient);
  private readonly db = inject(IndexedDbService);
  private readonly notifs = inject(NotificationsService);
  private readonly auth = inject(AuthService);

  readonly isOnline = signal<boolean>(true);
  readonly isSyncing = signal<boolean>(false);
  readonly pendingCount = signal<number>(0);
  readonly lastSync = signal<Date | null>(null);
  readonly lastError = signal<string | null>(null);
  readonly queue = signal<OfflineQueueItem[]>([]);

  private readonly pingUrl = '/favicon.ico';
  private heartbeatInterval: any = null;
  private isCheckingConnection = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        void this.checkRealConnectivity();
      });

      window.addEventListener('offline', () => {
        this.setOnline(false);
      });

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          void this.checkRealConnectivity();
        }
      });

      this.startHeartbeat();
    }

    void this.refreshQueue();
  }

  /**
   * Monitor activo de conectividad (Heartbeat).
   * Detecta inmediatamente cortes de Wi-Fi, modo avión o desconexiones físicas
   * contactando el CDN estático sin latencia ni dependencias de backend.
   */
  private startHeartbeat(): void {
    if (typeof window === 'undefined') return;
    setTimeout(() => void this.checkRealConnectivity(), 500);
    this.heartbeatInterval = setInterval(() => {
      void this.checkRealConnectivity();
    }, 4000);
  }

  /**
   * Verifica activamente si hay salida real a internet contactando el CDN estático de la app.
   */
  async checkRealConnectivity(): Promise<boolean> {
    if (typeof window === 'undefined') return true;

    // Si el navegador ya reporta offline de forma nativa:
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setOnline(false);
      return false;
    }

    if (this.isCheckingConnection) return this.isOnline();
    this.isCheckingConnection = true;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${this.pingUrl}?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        this.setOnline(true);
        return true;
      }
      this.setOnline(false);
      return false;
    } catch {
      this.setOnline(false);
      return false;
    } finally {
      this.isCheckingConnection = false;
    }
  }

  /**
   * Actualiza el estado online/offline garantizando reactividad en toda la app.
   */
  setOnline(online: boolean): void {
    const prev = this.isOnline();
    if (prev === online) return;

    this.isOnline.set(online);
    if (online) {
      this.notifs.info('Conexión a internet reestablecida (Online). Sincronizando operaciones pendientes...');
      void this.syncAll();
    } else {
      this.notifs.warning('Modo sin conexión detectado (Offline). Las ventas y reservas se guardarán localmente en IndexedDB.');
    }
  }

  /**
   * Alterna manualmente el estado online/offline.
   */
  toggleOnline(): void {
    this.setOnline(!this.isOnline());
  }

  async refreshQueue(): Promise<void> {
    const items = await this.db.getQueue();
    // Más recientes primero para la pantalla de monitoreo (CU-12).
    items.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    this.queue.set(items);
    const pending = items.filter(
      (i) => i.estado === 'LOCAL' || i.estado === 'CONFLICTO' || i.estado === 'ENVIADO'
    ).length;
    this.pendingCount.set(pending);
  }

  async triggerManualSync(): Promise<SyncBatchResponse | null> {
    return this.syncAll();
  }

  async clearConfirmed(): Promise<void> {
    await this.db.clearConfirmed();
    await this.refreshQueue();
  }

  async discardItem(item: OfflineQueueItem): Promise<void> {
    if (item.id === undefined) return;
    await this.db.removeQueueItem(item.id);
    await this.refreshQueue();
  }

  // ── REGISTRO DE VENTA OFFLINE (RN-03, RN-04, RNF05) ──

  async recordOfflineSale(data: {
    branch_id: number;
    client_id?: number;
    payment_method?: string;
    items: Array<{ stock_id: number; quantity: number; unit_price?: number }>;
    total?: number;
  }): Promise<OfflineQueueItem> {
    const tenantId = this.currentTenantId();
    const uuid = this.newUuid();
    const items = data.items.map((item) => ({
      stock_id: item.stock_id,
      quantity: item.quantity,
      unit_price: Number(item.unit_price ?? 0)
    }));
    const total =
      data.total ?? items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    const queueItem = await this.db.addToQueue({
      uuid,
      tipo: 'venta',
      datos: { ...data, tenant_id: tenantId, items, total },
      fecha: new Date().toISOString(),
      estado: 'LOCAL'
    });

    await this.refreshQueue();
    this.notifs.success(`Venta guardada localmente con UUID: ${uuid.substring(0, 8)}...`);

    if (this.isOnline()) {
      void this.syncAll();
    }

    return queueItem;
  }

  // ── REGISTRO DE RESERVA OFFLINE ──

  async recordOfflineReservation(data: {
    branch_id: number;
    client_id?: number;
    customer_name?: string;
    /** Fecha/hora elegida por el cliente (`YYYY-MM-DDTHH:mm:ss`). */
    created_at?: string;
    items: Array<{ stock_id: number; quantity: number; unit_price?: number }>;
  }): Promise<OfflineQueueItem> {
    const tenantId = this.currentTenantId();
    const uuid = this.newUuid();
    const items = data.items.map((item) => ({
      stock_id: item.stock_id,
      quantity: item.quantity,
      unit_price: Number(item.unit_price ?? 0)
    }));

    const queueItem = await this.db.addToQueue({
      uuid,
      tipo: 'reserva',
      datos: { ...data, tenant_id: tenantId, items, total: 0 },
      fecha: new Date().toISOString(),
      estado: 'LOCAL'
    });

    await this.refreshQueue();
    this.notifs.success(`Reserva guardada localmente con UUID: ${uuid.substring(0, 8)}...`);

    if (this.isOnline()) {
      void this.syncAll();
    }

    return queueItem;
  }

  // ── SINCRONIZACIÓN BATCH AL SERVIDOR (RNF05 / RN-05) ──

  async syncAll(): Promise<SyncBatchResponse | null> {
    if (this.isSyncing() || !this.isOnline()) return null;

    const allItems = await this.db.getQueue();
    const tenantId = this.auth.currentUser()?.tenant_id;
    if (!tenantId) {
      this.lastError.set('Inicia sesión en una empresa para sincronizar las operaciones offline.');
      return null;
    }

    // A tenant's offline operation must never be retried under another tenant's session.
    const pendingItems = allItems.filter((i) => i.estado === 'LOCAL');
    const localItems = pendingItems.filter((i) => i.datos?.tenant_id === tenantId);

    if (localItems.length === 0) {
      if (pendingItems.length > 0) {
        this.lastError.set(
          'Hay operaciones offline de otra empresa o sin tenant asociado. Inicia sesión en la empresa correspondiente para sincronizarlas.'
        );
      }
      await this.refreshQueue();
      return null;
    }

    this.isSyncing.set(true);
    this.lastError.set(null);

    const payload = { operations: localItems.map((item) => this.toOperation(item)) };

    try {
      const response = await this.http
        .post<SyncBatchResponse>(`${environment.apiUrl}/sync/batch`, payload)
        .toPromise();

      if (response && response.results) {
        for (const res of response.results) {
          const matched = localItems.find((i) => i.uuid === res.uuid);
          if (matched && matched.id !== undefined) {
            await this.db.updateQueueItem(matched.id, {
              estado: res.status,
              mensaje_servidor: res.message ?? undefined
            });
          }
        }

        // Las confirmadas y los duplicados idempotentes ya no requieren seguimiento.
        await this.db.clearConfirmed();
        this.lastSync.set(new Date());

        const confirmadas = response.confirmed ?? 0;
        const conflictos = response.conflicts ?? 0;
        const duplicadas = response.results.filter(
          (r) => r.status === 'DUPLICADO_IDEMPOTENTE'
        ).length;

        if (conflictos > 0) {
          this.notifs.warning(
            `Sincronización finalizada: ${confirmadas} confirmadas, ${duplicadas} duplicadas idempotentes, pero se detectaron ${conflictos} conflicto(s) de inventario.`
          );
        } else {
          this.notifs.success(
            `Sincronización exitosa: ${confirmadas} operaciones confirmadas (${duplicadas} idempotentes).`
          );
        }

        await this.refreshQueue();
        return response;
      }
    } catch (err: any) {
      const message = err?.error?.detail || err?.message || 'Error de red';
      this.lastError.set(String(message));
      this.notifs.error(`Error al sincronizar con el servidor: ${message}`);
    } finally {
      this.isSyncing.set(false);
      await this.refreshQueue();
    }

    return null;
  }

  /** Traduce una fila local al contrato real del backend (`SyncOperationItem`). */
  private toOperation(item: OfflineQueueItem): SyncOperationPayload {
    const datos = item.datos ?? {};
    const items = (datos.items ?? []).map((row: any) => ({
      stock_id: Number(row.stock_id),
      quantity: Number(row.quantity),
      unit_price: Number(row.unit_price ?? 0)
    }));
    return {
      uuid: item.uuid,
      type: item.tipo === 'reserva' ? 'RESERVATION' : 'SALE',
      created_at: datos.created_at ?? item.fecha,
      branch_id: Number(datos.branch_id),
      client_id: datos.client_id ?? null,
      total: Number(datos.total ?? 0),
      payment_method: datos.payment_method ?? 'efectivo',
      items
    };
  }

  private newUuid(): string {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private currentTenantId(): number {
    const tenantId = this.auth.currentUser()?.tenant_id;
    if (!tenantId) {
      throw new Error('No se puede registrar una operación offline sin una empresa activa.');
    }
    return tenantId;
  }
}
