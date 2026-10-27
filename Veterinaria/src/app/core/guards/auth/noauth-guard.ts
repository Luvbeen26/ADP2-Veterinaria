import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { Auth } from '../../services/auth/auth';
export const noauthGuard: CanActivateFn = () => {
  const auth = inject(Auth); const router = inject(Router);
  return auth.restore().pipe(map(ok => !ok || router.createUrlTree([auth.get_userRol() === 'V' ? '/vet' : '/'])));
};
