import { Injectable } from '@angular/core';
import { OfflineQueueItem, ProductResponse, StockResponse } from '../../models';

const DB_NAME = 'FashionStoreOfflineDB';
const DB_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class IndexedDbService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
          reject(new Error('IndexedDB no está soportado en este entorno'));
          return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Catálogo de productos local
          if (!db.objectStoreNames.contains('catalog')) {
            db.createObjectStore('catalog', { keyPath: 'id' });
          }

          // Existencias de inventario local
          if (!db.objectStoreNames.contains('inventory')) {
            db.createObjectStore('inventory', { keyPath: 'id' });
          }

          // Cola de sincronización resiliente con índice por UUID y estado
          if (!db.objectStoreNames.contains('sync_queue')) {
            const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
            queueStore.createIndex('uuid', 'uuid', { unique: true });
            queueStore.createIndex('estado', 'estado', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  // ── CATÁLOGO LOCAL ──

  async saveCatalog(products: ProductResponse[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('catalog', 'readwrite');
    const store = tx.objectStore('catalog');
    store.clear();
    for (const p of products) {
      store.put(p);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCatalog(): Promise<ProductResponse[]> {
    const db = await this.getDB();
    const tx = db.transaction('catalog', 'readonly');
    const store = tx.objectStore('catalog');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // ── INVENTARIO LOCAL ──

  async saveInventory(stocks: StockResponse[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('inventory', 'readwrite');
    const store = tx.objectStore('inventory');
    store.clear();
    for (const s of stocks) {
      store.put(s);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getInventory(): Promise<StockResponse[]> {
    const db = await this.getDB();
    const tx = db.transaction('inventory', 'readonly');
    const store = tx.objectStore('inventory');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // ── COLA DE SINCRONIZACIÓN (SYNC_QUEUE) ──

  async addToQueue(item: Omit<OfflineQueueItem, 'id'>): Promise<OfflineQueueItem> {
    const db = await this.getDB();
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const request = store.add(item);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve({ ...item, id: request.result as number });
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async getQueue(): Promise<OfflineQueueItem[]> {
    const db = await this.getDB();
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async updateQueueItem(id: number, updates: Partial<OfflineQueueItem>): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const getReq = store.get(id);

    return new Promise((resolve, reject) => {
      getReq.onsuccess = () => {
        const current = getReq.result;
        if (!current) {
          resolve();
          return;
        }
        const updated = { ...current, ...updates };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async clearConfirmed(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = request.result as OfflineQueueItem[];
        for (const item of items) {
          if (item.estado === 'CONFIRMADO' || item.estado === 'DUPLICADO_IDEMPOTENTE') {
            if (item.id) store.delete(item.id);
          }
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
}
