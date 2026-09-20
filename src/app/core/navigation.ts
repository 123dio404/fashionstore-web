import { Role } from '../models';

/**
 * Iconos de línea — copiados literalmente de `WebLayout.tsx` del diseño web de Figma
 * para que la web se vea igual al prototipo (sin emojis, sin fuentes de iconos).
 */
export const ICONS = {
  catalog: 'M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18',
  sparkles: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  cart: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  purchases: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  box: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  suppliers: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  store: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  reports: 'M18 20V10M12 20V4M6 20v-6',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  terminal: 'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM12 12v.01',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.35-4.35'],
  chevronRight: 'M9 18l6-6-6-6',
  chevronDown: 'M6 9l6 6 6-6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  collapse: ['M19 12H5', 'M12 19l-7-7 7-7'],
  expand: ['M5 12h14', 'M12 5l7 7-7 7'],
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
};

export interface NavItem {
  /** Texto visible en la barra lateral */
  label: string;
  /** Ruta real de la aplicación Angular */
  path: string;
  icon: string | string[];
  /**
   * Trazabilidad interna: caso de uso del documento (`Parcial1-SI2.md`) al que corresponde la
   * pantalla. **No se muestra en la interfaz** (el prototipo de Figma no incluye estos códigos).
   */
  cu?: string;
  /** Muestra el contador del carrito en la barra lateral */
  badge?: 'cart';
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const CLIENT_NAV: NavGroup[] = [
  {
    label: 'Tienda',
    items: [
      { label: 'Catálogo', path: '/catalog', icon: ICONS.catalog, cu: 'CU08' },
      { label: 'Para ti · IA', path: '/recommendations', icon: ICONS.sparkles, cu: 'CU18' },
      { label: 'Carrito', path: '/cart', icon: ICONS.cart, cu: 'CU10', badge: 'cart' },
      { label: 'Reservas', path: '/my-reservations', icon: ICONS.calendar, cu: 'CU15' },
      { label: 'Mis compras', path: '/purchase-history', icon: ICONS.purchases, cu: 'CU16' },
      { label: 'Promociones', path: '/promotions', icon: ICONS.tag, cu: 'CU20' },
      { label: 'Asistente', path: '/chatbot', icon: ICONS.chat, cu: 'CU19' }
    ]
  }
];

const ADMIN_NAV: NavGroup[] = [
  {
    label: 'Panel',
    items: [{ label: 'Panel gerencial', path: '/reports/dashboard', icon: ICONS.grid, cu: 'CU23' }]
  },
  {
    label: 'Comercial',
    items: [
      { label: 'Catálogo', path: '/admin/products', icon: ICONS.catalog, cu: 'CU05' },
      { label: 'Parámetros', path: '/admin/parameters', icon: ICONS.settings, cu: 'CU06' },
      { label: 'Promociones', path: '/admin/marketing', icon: ICONS.tag, cu: 'CU20' },
      { label: 'Inventario', path: '/admin/inventory', icon: ICONS.box, cu: 'CU09' }
    ]
  },
  {
    label: 'Organización',
    items: [
      { label: 'Usuarios', path: '/admin/users', icon: ICONS.users, cu: 'CU03' },
      { label: 'Sucursales', path: '/admin/branches', icon: ICONS.store, cu: 'CU04' },
      { label: 'Proveedores', path: '/admin/suppliers', icon: ICONS.suppliers, cu: 'CU07' }
    ]
  },
  {
    label: 'Informes',
    items: [
      { label: 'Ventas', path: '/reports/sales', icon: ICONS.reports, cu: 'CU21' },
      { label: 'Inventario', path: '/reports/inventory', icon: ICONS.activity, cu: 'CU22' },
      { label: 'Analítica IA', path: '/reports/analytical', icon: ICONS.sparkles, cu: 'CU24' }
    ]
  },
  {
    label: 'Tienda',
    items: [
      { label: 'Terminal de venta', path: '/pos', icon: ICONS.terminal, cu: 'CU12' },
      { label: 'Reservas en tienda', path: '/reservations', icon: ICONS.calendar, cu: 'CU14' }
    ]
  }
];

const MANAGER_NAV: NavGroup[] = [
  {
    label: 'Comercial',
    items: [
      { label: 'Catálogo', path: '/admin/products', icon: ICONS.catalog, cu: 'CU05' },
      { label: 'Parámetros', path: '/admin/parameters', icon: ICONS.settings, cu: 'CU06' },
      { label: 'Inventario', path: '/admin/inventory', icon: ICONS.box, cu: 'CU09' }
    ]
  },
  {
    label: 'Organización',
    items: [
      { label: 'Sucursales', path: '/admin/branches', icon: ICONS.store, cu: 'CU04' },
      { label: 'Proveedores', path: '/admin/suppliers', icon: ICONS.suppliers, cu: 'CU07' }
    ]
  },
  {
    label: 'Informes',
    items: [{ label: 'Ventas', path: '/reports/sales', icon: ICONS.reports, cu: 'CU21' }]
  },
  {
    label: 'Tienda',
    items: [
      { label: 'Terminal de venta', path: '/pos', icon: ICONS.terminal, cu: 'CU12' },
      { label: 'Reservas en tienda', path: '/reservations', icon: ICONS.calendar, cu: 'CU14' }
    ]
  }
];

/** Cajero: solo operación de tienda (equivale a `posNav` del prototipo web de Figma). */
const CASHIER_NAV: NavGroup[] = [
  {
    label: 'Tienda',
    items: [
      { label: 'Terminal de venta', path: '/pos', icon: ICONS.terminal, cu: 'CU12' },
      { label: 'Reservas en tienda', path: '/reservations', icon: ICONS.calendar, cu: 'CU14' }
    ]
  }
];

export function navForRole(role: Role | undefined): NavGroup[] {
  switch (role) {
    case Role.Administrador:
      return ADMIN_NAV;
    case Role.Encargado:
      return MANAGER_NAV;
    case Role.Cajero:
      return CASHIER_NAV;
    case Role.Cliente:
      return CLIENT_NAV;
    default:
      return [];
  }
}

/** Etiqueta y color de la insignia de rol (colores del prototipo web de Figma). */
export const ROLE_META: Record<Role, { label: string; color: string }> = {
  [Role.Cliente]: { label: 'Cliente', color: '#6366f1' },
  [Role.Administrador]: { label: 'Administrador', color: 'var(--brand)' },
  [Role.Encargado]: { label: 'Encargado de sucursal', color: '#d97706' },
  [Role.Cajero]: { label: 'Punto de venta', color: '#059669' },
  [Role.Proveedor]: { label: 'Proveedor', color: 'var(--muted)' }
};

