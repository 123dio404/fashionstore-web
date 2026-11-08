import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  id: string;
  tenantId?: number | null;
  userId?: number | null;
  title: string;
  message: string;
  date: string;
  saleId?: number;
  transactionRef?: string;
  amount?: number;
  invoiceNumber?: string;
  type: 'purchase_success' | 'payment_rejected' | 'reservation' | 'billing_reminder' | 'subscription_alert' | 'promotion' | 'system' | 'pos_sale' | 'cash_close' | 'stock_critical' | 'tenant_status' | 'subscription_payment';
  isRead: boolean;
  link?: string;
}

const STORAGE_PREFIX = 'fs_notifs_t_';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;
  private currentKey = 'guest';

  readonly notifications = signal<NotificationItem[]>([]);

  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.isRead).length
  );

  constructor() {
    this.reloadForUser(null);
  }

  reloadForUser(user: any): void {
    const key = user?.tenant_id ? `tenant_${user.tenant_id}_user_${user.id || 'any'}` : (user?.id ? `user_${user.id}` : 'guest');
    this.currentKey = key;
    let items = this.loadForStorageKey(key);
    // Si el usuario es de tipo personal (Cajero, Encargado, Administrador, Superadmin),
    // limpiar notificaciones residuales o simuladas de cliente ("Tu pedido #...", "¡Compra confirmada!")
    if (user?.role && user.role !== 'Cliente') {
      items = items.filter(
        (n) => !n.title.toLowerCase().includes('compra confirmada') &&
               !n.message.toLowerCase().includes('tu pedido #')
      );
      this.persist(items);
    }
    this.notifications.set(items);
    if (user) {
      this.fetchFromBackend();
    }
  }

  fetchFromBackend(): void {
    this.http.get<any[]>(`${this.apiUrl}/me`).subscribe({
      next: (remote) => {
        if (!remote || remote.length === 0) return;
        this.notifications.update((current) => {
          let updated = [...current];
          for (const item of remote) {
            const notifId = `backend-${item.id}`;
            const existingIdx = updated.findIndex((n) => n.id === notifId);
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy';
            const converted: NotificationItem = {
              id: notifId,
              tenantId: item.tenant_id,
              userId: item.user_id,
              title: item.title,
              message: item.message,
              date: dateStr,
              type: (item.type as any) || 'system',
              isRead: item.is_read,
              link: item.link || undefined,
            };
            if (existingIdx >= 0) {
              updated[existingIdx] = converted;
            } else {
              updated = [converted, ...updated];
            }
          }
          updated = updated.slice(0, 40);
          this.persist(updated);
          return updated;
        });
      },
      error: () => {
        // Fallback gracefully on network error
      }
    });
  }

  broadcastToTenants(data: { tenant_ids?: number[]; title: string; message: string; type?: string; link?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/broadcast-tenants`, data).pipe(
      tap(() => this.fetchFromBackend())
    );
  }

  broadcastToCustomers(data: { title: string; message: string; type?: string; link?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/broadcast-customers`, data).pipe(
      tap(() => this.fetchFromBackend())
    );
  }

  private loadForStorageKey(key: string): NotificationItem[] {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (saved) {
        return JSON.parse(saved) as NotificationItem[];
      }
    } catch {
      // Fallback
    }

    return [
      {
        id: `notif-welcome-${key}`,
        title: '¡Bienvenido a la plataforma SaaS!',
        message: 'Catálogo de productos, pedidos, reservas y stock aislados según tu empresa.',
        date: 'Hoy',
        type: 'system',
        isRead: false,
        link: '/catalog',
      },
    ];
  }

  private persist(items: NotificationItem[]): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${this.currentKey}`, JSON.stringify(items));
    } catch {
      // Ignore quota errors
    }
  }

  addNotification(
    data: Omit<NotificationItem, 'id' | 'date' | 'isRead'> & { date?: string }
  ): void {
    const newItem: NotificationItem = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: data.date ?? 'Ahora',
      isRead: false,
    };

    this.notifications.update((current) => {
      const updated = [newItem, ...current].slice(0, 30); // Limitar a las últimas 30
      this.persist(updated);
      return updated;
    });
  }

  markAsRead(id: string): void {
    this.notifications.update((current) => {
      const updated = current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      this.persist(updated);
      return updated;
    });
    if (id.startsWith('backend-')) {
      const backendId = parseInt(id.replace('backend-', ''), 10);
      if (!isNaN(backendId)) {
        this.http.patch(`${this.apiUrl}/${backendId}/read`, {}).subscribe({ error: () => {} });
      }
    }
  }

  markAllAsRead(): void {
    this.notifications.update((current) => {
      const updated = current.map((n) => ({ ...n, isRead: true }));
      this.persist(updated);
      return updated;
    });
    this.http.post(`${this.apiUrl}/read-all`, {}).subscribe({ error: () => {} });
  }

  clearAll(): void {
    this.notifications.set([]);
    this.persist([]);
    this.http.delete(`${this.apiUrl}/clear`).subscribe({ error: () => {} });
  }

  success(message: string, title: string = 'Operación Exitosa'): void {
    this.addNotification({ title, message, type: 'purchase_success' });
  }

  error(message: string, title: string = 'Error'): void {
    this.addNotification({ title, message, type: 'payment_rejected' });
  }

  warning(message: string, title: string = 'Atención'): void {
    this.addNotification({ title, message, type: 'system' });
  }

  info(message: string, title: string = 'Información'): void {
    this.addNotification({ title, message, type: 'system' });
  }

  /**
   * Sincroniza las ventas reales (`/commerce/sales`) con las notificaciones locales,
   * EXCLUSIVAMENTE para clientes que esperan ver sus pedidos realizados desde web o móvil.
   */
  syncFromSales(sales: Array<{ id: number; total: number | string; sale_date?: string }>, isCustomer: boolean = true): void {
    if (!isCustomer) return;
    let changed = false;
    this.notifications.update((current) => {
      let updated = [...current];
      for (const sale of sales) {
        const notifId = `sale-${sale.id}`;
        const exists = updated.some(
          (n) => n.id === notifId || n.saleId === sale.id || n.message.includes(`#${sale.id}`)
        );
        if (!exists) {
          const totalNum = Number(sale.total) || 0;
          const newItem: NotificationItem = {
            id: notifId,
            saleId: sale.id,
            title: '¡Compra confirmada!',
            message: `Tu pedido #${sale.id} por Bs. ${totalNum.toFixed(2)} fue procesado con éxito y el stock fue actualizado.`,
            date: 'Hoy',
            type: 'purchase_success',
            isRead: false,
            link: '/purchases',
          };
          updated = [newItem, ...updated];
          changed = true;
        }
      }
      if (changed) {
        updated = updated.slice(0, 30);
        this.persist(updated);
      }
      return updated;
    });
  }
}
