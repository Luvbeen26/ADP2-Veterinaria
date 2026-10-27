import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { Auth } from '../../services/auth/auth';
export const authGuard: CanActivateFn = (_, state) => {
  const auth = inject(Auth); const router = inject(Router);
  return auth.restore().pipe(map(ok => {
    if (!ok) return router.createUrlTree(['/auth/login']);
    if (auth.get_userRol() === 'C') return true;
    if (auth.get_userRol() === 'V' && state.url.split(/[?;#]/)[0] === '/pets/register-pet') return true;
    return router.createUrlTree(['/vet']);
  }));
};
