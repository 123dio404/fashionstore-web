import { Routes } from '@angular/router';
import { Role } from './models';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

const ADMIN = [Role.Administrador];
const MANAGER = [Role.Administrador, Role.Encargado];
const STAFF = [Role.Administrador, Role.Encargado, Role.Cajero];

export const routes: Routes = [
  // CU01 / CU02 - Auth
  { path: 'auth/login', loadComponent: () => import('./pages/auth/login.page').then((m) => m.LoginPage) },
  { path: 'auth/register', loadComponent: () => import('./pages/auth/register.page').then((m) => m.RegisterPage) },

  // CU08 - Public catalog
  { path: 'catalog', loadComponent: () => import('./pages/catalog/catalog.page').then((m) => m.CatalogPage) },
  { path: 'catalog/:id', loadComponent: () => import('./pages/catalog/product-detail.page').then((m) => m.ProductDetailPage) },

  // CU10 / CU11 - Cart and checkout
  { path: 'cart', canActivate: [authGuard], loadComponent: () => import('./pages/cart/cart.page').then((m) => m.CartPage) },

  // CU02 - Profile
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./pages/account/profile.page').then((m) => m.ProfilePage) },

  // CU16 - Purchase history
  { path: 'purchase-history', canActivate: [authGuard], loadComponent: () => import('./pages/account/purchase-history.page').then((m) => m.PurchaseHistoryPage) },

  // CU15 - Client reservations
  { path: 'my-reservations', canActivate: [authGuard], loadComponent: () => import('./pages/reservations/my-reservations.page').then((m) => m.MyReservationsPage) },

  // CU18 / CU19 - Experience
  { path: 'recommendations', canActivate: [authGuard], loadComponent: () => import('./pages/experience/recommendations.page').then((m) => m.RecommendationsPage) },
  { path: 'chatbot', canActivate: [authGuard], loadComponent: () => import('./pages/experience/chatbot.page').then((m) => m.ChatbotPage) },

  // CU05 / CU06 / CU04 / CU07 / CU09 - Management
  { path: 'admin/products', canActivate: [authGuard, roleGuard], data: { roles: MANAGER }, loadComponent: () => import('./pages/admin/products.page').then((m) => m.ProductsPage) },
  { path: 'admin/parameters', canActivate: [authGuard, roleGuard], data: { roles: MANAGER }, loadComponent: () => import('./pages/admin/parameters.page').then((m) => m.ParametersPage) },
  { path: 'admin/branches', canActivate: [authGuard, roleGuard], data: { roles: MANAGER }, loadComponent: () => import('./pages/admin/branches.page').then((m) => m.BranchesPage) },
  { path: 'admin/suppliers', canActivate: [authGuard, roleGuard], data: { roles: MANAGER }, loadComponent: () => import('./pages/admin/suppliers.page').then((m) => m.SuppliersPage) },
  { path: 'admin/inventory', canActivate: [authGuard, roleGuard], data: { roles: MANAGER }, loadComponent: () => import('./pages/admin/inventory.page').then((m) => m.InventoryPage) },

  // CU03 / CU20 - Admin only
  { path: 'admin/users', canActivate: [authGuard, roleGuard], data: { roles: ADMIN }, loadComponent: () => import('./pages/admin/users.page').then((m) => m.UsersPage) },
  { path: 'admin/marketing', canActivate: [authGuard, roleGuard], data: { roles: ADMIN }, loadComponent: () => import('./pages/admin/marketing.page').then((m) => m.MarketingPage) },

  // CU12 / CU14 - Staff operations
  { path: 'pos', canActivate: [authGuard, roleGuard], data: { roles: STAFF }, loadComponent: () => import('./pages/pos/pos.page').then((m) => m.PosPage) },
  { path: 'reservations', canActivate: [authGuard, roleGuard], data: { roles: STAFF }, loadComponent: () => import('./pages/reservations/reservations.page').then((m) => m.ReservationsPage) },

  // CU21 / CU22 / CU23 / CU24 - Reports
  { path: 'reports/dashboard', canActivate: [authGuard, roleGuard], data: { roles: ADMIN }, loadComponent: () => import('./pages/reports/dashboard.page').then((m) => m.DashboardPage) },
  { path: 'reports/sales', canActivate: [authGuard, roleGuard], data: { roles: MANAGER }, loadComponent: () => import('./pages/reports/sales.page').then((m) => m.SalesReportPage) },
  { path: 'reports/inventory', canActivate: [authGuard, roleGuard], data: { roles: ADMIN }, loadComponent: () => import('./pages/reports/inventory.page').then((m) => m.InventoryReportPage) },
  { path: 'reports/analytical', canActivate: [authGuard, roleGuard], data: { roles: ADMIN }, loadComponent: () => import('./pages/reports/analytical.page').then((m) => m.AnalyticalPage) },

  { path: 'forbidden', loadComponent: () => import('./pages/shared/forbidden.page').then((m) => m.ForbiddenPage) },
  { path: '', pathMatch: 'full', redirectTo: 'catalog' },
  { path: '**', redirectTo: 'catalog' }
];
