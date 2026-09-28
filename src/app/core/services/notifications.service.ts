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
}
