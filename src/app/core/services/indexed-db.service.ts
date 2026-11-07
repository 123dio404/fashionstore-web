import { Injectable } from '@angular/core';
import {
  BranchResponse,
  OfflineQueueItem,
  ProductResponse,
  SizeResponse,
  StockResponse
} from '../../models';

const DB_NAME = 'FashionStoreOfflineDB';
// v2 agrega el almacén de sucursales; v3 agrega tallas para poder mapear
// variante → talla al crear reservas sin conexión (CU-15).
const DB_VERSION = 3;

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

          // Sucursales locales (necesarias para armar el mapa de stock offline)
          if (!db.objectStoreNames.contains('branches')) {
            db.createObjectStore('branches', { keyPath: 'id' });
          }

          // Tallas locales (mapean variant.size_id → nombre de talla offline)
          if (!db.objectStoreNames.contains('sizes')) {
            db.createObjectStore('sizes', { keyPath: 'id' });
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

  // ── SUCURSALES LOCAL ──

  async saveBranches(branches: BranchResponse[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('branches', 'readwrite');
    const store = tx.objectStore('branches');
    store.clear();
    for (const b of branches) {
      store.put(b);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getBranches(): Promise<BranchResponse[]> {
    const db = await this.getDB();
    const tx = db.transaction('branches', 'readonly');
    const store = tx.objectStore('branches');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // ── TALLAS LOCAL ──

  async saveSizes(sizes: SizeResponse[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('sizes', 'readwrite');
    const store = tx.objectStore('sizes');
    store.clear();
    for (const s of sizes) {
      store.put(s);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSizes(): Promise<SizeResponse[]> {
    const db = await this.getDB();
    const tx = db.transaction('sizes', 'readonly');
    const store = tx.objectStore('sizes');
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

  async removeQueueItem(id: number): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('sync_queue', 'readwrite');
    tx.objectStore('sync_queue').delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
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
