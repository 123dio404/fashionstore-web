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
    loadComponent: () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: [Role.Administrador, Role.Encargado] },
    children: [
      { path: 'users', loadComponent: () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage) },
      { path: 'branches', loadComponent: () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage) },
      { path: 'catalog', loadComponent: () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage) },
      { path: 'parameters', loadComponent: () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage) },
      { path: 'suppliers', loadComponent: () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage) },
      { path: 'inventory', loadComponent: () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage) }
    ]
  },
  {
    path: 'catalog',
    loadComponent: () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage)
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage)
  },
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/home.page').then((m) => m.HomePage) },
  { path: '**', redirectTo: 'catalog' }
];
