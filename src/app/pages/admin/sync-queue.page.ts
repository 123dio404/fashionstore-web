import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

import { CatalogStore } from '../../core/services/catalog-store.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { SyncManagerService } from '../../core/services/sync-manager.service';
import { OfflineQueueItem } from '../../models';

/**
 * CU-12 / CU-13 — Monitoreo de la cola offline y sincronización con el backend.
 * Muestra el UUID, tipo, fecha, estado local y mensaje devuelto por `POST /sync/batch`,
 * y permite reintentar la sincronización o descartar operaciones conflictivas.
 */
@Component({
  selector: 'app-sync-queue-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sync-queue.page.html',
  styleUrls: ['./sync-queue.page.scss']
})
export class SyncQueuePage implements OnInit {
  readonly sync = inject(SyncManagerService);
  readonly catalog = inject(CatalogStore);
  private readonly notifs = inject(NotificationsService);

  readonly statusLabels: Record<string, string> = {
    LOCAL: 'Pendiente local',
    ENVIADO: 'Enviado',
    CONFIRMADO: 'Confirmado',
    DUPLICADO_IDEMPOTENTE: 'Duplicado idempotente',
    CONFLICTO: 'Conflicto'
  };

  ngOnInit(): void {
    void this.sync.refreshQueue();
  }

  async refresh(): Promise<void> {
    await this.sync.refreshQueue();
  }

  async syncNow(): Promise<void> {
    const response = await this.sync.triggerManualSync();
    if (!response && this.sync.isOnline()) {
      this.notifs.info('No hay operaciones locales pendientes por sincronizar.');
    }
  }

  async clearConfirmed(): Promise<void> {
    await this.sync.clearConfirmed();
    this.notifs.success('Se eliminaron las operaciones ya confirmadas del historial local.');
  }

  async discard(item: OfflineQueueItem): Promise<void> {
    await this.sync.discardItem(item);
    this.notifs.warning(`Operación ${item.uuid.substring(0, 8)}… descartada localmente.`);
  }

  prepareOffline(): void {
    this.catalog.prepareOffline();
  }

  badgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMADO':
        return 'ok';
      case 'DUPLICADO_IDEMPOTENTE':
        return 'dup';
      case 'CONFLICTO':
        return 'conflict';
      default:
        return 'pending';
    }
  }

  totalOf(item: OfflineQueueItem): number {
    return Number(item?.datos?.total ?? 0);
  }

  itemCount(item: OfflineQueueItem): number {
    return Array.isArray(item?.datos?.items) ? item.datos.items.length : 0;
  }
}
