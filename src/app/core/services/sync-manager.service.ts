import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OfflineQueueItem, SyncBatchResponse } from '../../models';
import { IndexedDbService } from './indexed-db.service';
import { NotificationsService } from './notifications.service';

@Injectable({ providedIn: 'root' })
export class SyncManagerService {
  private readonly http = inject(HttpClient);
  private readonly db = inject(IndexedDbService);
  private readonly notifs = inject(NotificationsService);

  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly isSyncing = signal<boolean>(false);
  readonly pendingCount = signal<number>(0);
  readonly lastSync = signal<Date | null>(null);
  readonly queue = signal<OfflineQueueItem[]>([]);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline.set(true);
        this.notifs.info('Conexión reestablecida. Sincronizando operaciones pendientes...');
        this.syncAll();
      });

      window.addEventListener('offline', () => {
        this.isOnline.set(false);
        this.notifs.warning('Modo sin conexión activo (PWA). Las operaciones se guardarán localmente en IndexedDB.');
      });
    }

    this.refreshQueue();
  }

  async refreshQueue(): Promise<void> {
    const items = await this.db.getQueue();
    this.queue.set(items);
    const pending = items.filter((i) => i.estado === 'LOCAL' || i.estado === 'CONFLICTO').length;
    this.pendingCount.set(pending);
  }

  async triggerManualSync(): Promise<SyncBatchResponse | null> {
    return this.syncAll();
  }

  // ── REGISTRO DE VENTA OFFLINE (RN-03, RN-04, RNF05) ──

  async recordOfflineSale(data: {
    branch_id: number;
    client_id?: number;
    items: Array<{ stock_id: number; quantity: number; unit_price?: number }>;
    total?: number;
  }): Promise<OfflineQueueItem> {
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `offline-${Date.now()}`;
    const queueItem = await this.db.addToQueue({
      uuid,
      tipo: 'venta',
      datos: data,
      fecha: new Date().toISOString(),
      estado: 'LOCAL'
    });

    await this.refreshQueue();
    this.notifs.success(`Venta guardada localmente con UUID: ${uuid.substring(0, 8)}...`);

    if (this.isOnline()) {
      this.syncAll();
    }

    return queueItem;
  }

  // ── REGISTRO DE RESERVA OFFLINE ──

  async recordOfflineReservation(data: {
    branch_id: number;
    customer_name?: string;
    items: Array<{ variant_id: number; quantity: number }>;
  }): Promise<OfflineQueueItem> {
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `offline-${Date.now()}`;
    const queueItem = await this.db.addToQueue({
      uuid,
      tipo: 'reserva',
      datos: data,
      fecha: new Date().toISOString(),
      estado: 'LOCAL'
    });

    await this.refreshQueue();
    this.notifs.success(`Reserva guardada localmente con UUID: ${uuid.substring(0, 8)}...`);

    if (this.isOnline()) {
      this.syncAll();
    }

    return queueItem;
  }

  // ── SINCRONIZACIÓN BATCH AL SERVIDOR (RNF05 / RN-05) ──

  async syncAll(): Promise<SyncBatchResponse | null> {
    if (this.isSyncing() || !this.isOnline()) return null;

    const allItems = await this.db.getQueue();
    const localItems = allItems.filter((i) => i.estado === 'LOCAL');

    if (localItems.length === 0) {
      await this.refreshQueue();
      return null;
    }

    this.isSyncing.set(true);

    const payload = {
      operaciones: localItems.map((item) => ({
        uuid: item.uuid,
        tipo: item.tipo,
        datos: item.datos,
        fecha_local: item.fecha
      }))
    };

    try {
      const response = await this.http
        .post<SyncBatchResponse>(`${environment.apiUrl}/sync/batch`, payload)
        .toPromise();

      if (response && response.resultados) {
        for (const res of response.resultados) {
          const matched = localItems.find((i) => i.uuid === res.uuid);
          if (matched && matched.id) {
            await this.db.updateQueueItem(matched.id, {
              estado: res.estado,
              mensaje_servidor: res.mensaje
            });
          }
        }

        // Limpiar las transacciones que ya fueron confirmadas con éxito
        await this.db.clearConfirmed();
        this.lastSync.set(new Date());

        const confirmadas = response.confirmadas || 0;
        const conflictos = response.conflictos || 0;
        const dup = response.duplicadas_idempotentes || 0;

        if (conflictos > 0) {
          this.notifs.warning(
            `Sincronización finalizada: ${confirmadas} confirmadas, ${dup} duplicadas idempotentes, pero se detectaron ${conflictos} conflicto(s) de inventario.`
          );
        } else {
          this.notifs.success(
            `Sincronización exitosa: ${confirmadas} operaciones confirmadas (${dup} idempotentes).`
          );
        }

        await this.refreshQueue();
        return response;
      }
    } catch (err: any) {
      this.notifs.error(`Error al sincronizar con el servidor: ${err.message || 'Error de red'}`);
    } finally {
      this.isSyncing.set(false);
      await this.refreshQueue();
    }

    return null;
  }
}
