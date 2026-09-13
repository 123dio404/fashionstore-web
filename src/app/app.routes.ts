import { Routes } from '@angular/router';
import { Role } from './models';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/home.page').then((m) => m.HomePage) },
  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage) },
      { path: 'register', loadComponent: () => import('./pages/register.page').then((m) => m.RegisterPage) }
    ]
  },
  {
    path: 'catalog',
    loadComponent: () => import('./pages/catalog.page').then((m) => m.CatalogPage)
  },
  {
    path: 'catalog/:id',
    loadComponent: () => import('./pages/product-detail.page').then((m) => m.ProductDetailPage)
  },
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cart.page').then((m) => m.CartPage)
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/account.page').then((m) => m.AccountPage)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: [Role.Administrador, Role.Encargado, Role.Cajero] },
    children: [
      { path: '', loadComponent: () => import('./pages/admin-dashboard.page').then((m) => m.AdminDashboardPage) },
      {
        path: 'inventory',
        loadComponent: () => import('./pages/inventory.page').then((m) => m.InventoryPage)
      },
      {
        path: 'sales',
        loadComponent: () => import('./pages/sales.page').then((m) => m.SalesPage)
      },
      {
        path: 'finance',
        loadComponent: () => import('./pages/finance.page').then((m) => m.FinancePage)
      },
      {
        path: 'operations',
        loadComponent: () => import('./pages/operations.page').then((m) => m.OperationsPage)
      },
      {
        path: 'management/:module',
        loadComponent: () => import('./pages/management.page').then((m) => m.ManagementPage)
      }
    ]
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./pages/forbidden.page').then((m) => m.ForbiddenPage)
  },
  { path: '**', redirectTo: 'catalog' }
];