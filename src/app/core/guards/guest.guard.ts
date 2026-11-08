import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { Role } from '../../models';

/**
 * Solo para visitantes sin sesión. Si ya hay sesión, envía al inicio del rol
 * en lugar de mostrar la landing pública dentro del shell autenticado.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.hasToken()) return true;

  const role = auth.currentUser()?.role;
  if (role === Role.Superadmin) {
    return router.createUrlTree(['/admin/tenants']);
  }
  if (role === Role.Administrador) {
    return router.createUrlTree(['/reports/dashboard']);
  }
  if (role === Role.Encargado || role === Role.Cajero) {
    return router.createUrlTree(['/pos']);
  }
  return router.createUrlTree(['/catalog']);
};
