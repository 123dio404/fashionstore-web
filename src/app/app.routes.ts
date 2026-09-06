import { Routes } from '@angular/router';
import { Role } from './models';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage) },
      { path: 'register', loadComponent: () => import('./pages/register.page').then((m) => m.RegisterPage) }
    ]
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile.page').then((m) => m.ProfilePage)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: [Role.Administrador, Role.Encargado] },
    children: [
      { path: 'inventory', loadComponent: () => import('./pages/inventory.page').then((m) => m.InventoryPage) },
      { path: 'products/:id', loadComponent: () => import('./pages/product-detail.page').then((m) => m.ProductDetailPage) },
      { path: 'parameters/:module', loadComponent: () => import('./pages/management.page').then((m) => m.ManagementPage) },
      { path: ':module', loadComponent: () => import('./pages/management.page').then((m) => m.ManagementPage) }
    ]
  },
  {
    path: 'catalog',
    loadComponent: () => import('./pages/catalog.page').then((m) => m.CatalogPage)
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./pages/forbidden.page').then((m) => m.ForbiddenPage)
  },
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/home.page').then((m) => m.HomePage) },
  { path: '**', redirectTo: 'catalog' }
];
