import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { Auth } from '../../services/auth/auth';
export const sessionGuard: CanActivateFn = () => {
  const auth = inject(Auth); const router = inject(Router);
  return auth.restore().pipe(map(ok => ok || router.createUrlTree(['/auth/login'])));
};
export const auditGuard: CanActivateFn = () => {
  const auth = inject(Auth); const router = inject(Router);
  return auth.restore().pipe(map(ok => ok && auth.security.auditEnabled && auth.hasPermission('security:audit:read') ? true : router.createUrlTree(['/account/security'])));
};

/** Existing role guards remain the legacy policy; effective permissions are server supplied only. */
export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const auth = inject(Auth); const router = inject(Router);
    return auth.restore().pipe(map(ok => ok && (!auth.security.enabled || auth.hasPermission(permission)) ? true : router.createUrlTree(['/'])));
  };
}
