import { Injectable, computed, signal } from '@angular/core';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  saleId?: number;
  transactionRef?: string;
  amount?: number;
  invoiceNumber?: string;
  type: 'purchase_success' | 'payment_rejected' | 'reservation' | 'system';
  isRead: boolean;
  link?: string;
}

const STORAGE_KEY = 'fashionstore_notifications_v1';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  readonly notifications = signal<NotificationItem[]>(this.loadInitial());

  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.isRead).length
  );

  private loadInitial(): NotificationItem[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as NotificationItem[];
      }
    } catch {
      // Fallback
    }

    // Notificaciones iniciales de cortesía
    return [
      {
        id: 'notif-welcome',
        title: '¡Bienvenido a FashionStore!',
        message: 'Explora nuestra nueva colección Otoño-Invierno con recomendaciones personalizadas de IA.',
        date: 'Hoy',
        type: 'system',
        isRead: false,
        link: '/catalog',
      },
      {
        id: 'notif-promo',
        title: 'Cupón de Descuento Disponible',
        message: 'Usa el cupón FASHION10 en tu carrito para obtener un 10% de descuento en tu compra.',
        date: 'Hoy',
        type: 'system',
        isRead: false,
        link: '/cart',
      },
    ];
  }

  private persist(items: NotificationItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
  }

  markAllAsRead(): void {
    this.notifications.update((current) => {
      const updated = current.map((n) => ({ ...n, isRead: true }));
      this.persist(updated);
      return updated;
    });
  }

  clearAll(): void {
    this.notifications.set([]);
    this.persist([]);
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
   * de modo que compras realizadas desde el móvil aparezcan automáticamente en la web.
   */
  syncFromSales(sales: Array<{ id: number; total: number | string; sale_date?: string }>): void {
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
            message: `Tu pedido #${sale.id} por $${totalNum.toFixed(2)} fue procesado con éxito y el stock fue actualizado.`,
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
