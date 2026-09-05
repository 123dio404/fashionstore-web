import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { Role } from '../../models';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as Role[] | undefined;
  if (!auth.hasToken()) {
    return router.createUrlTree(['/auth/login']);
  }
  if (!allowedRoles?.length) {
    return true;
  }
  const currentUser = auth.currentUser();
  if (currentUser) {
    return allowedRoles.includes(currentUser.role)
      ? true
      : router.createUrlTree(['/forbidden']);
  }
  return auth.getCurrentUser().pipe(
    map((user) => allowedRoles.includes(user.role)
      ? true
      : router.createUrlTree(['/forbidden']))
  );
};
