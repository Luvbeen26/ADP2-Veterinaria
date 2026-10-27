import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { Auth } from '../../services/auth/auth';
export const authVeterinarioGuard: CanActivateFn = () => {
  const auth = inject(Auth); const router = inject(Router);
  return auth.restore().pipe(map(ok => ok && auth.get_userRol() === 'V' ? true : router.createUrlTree(['/'])));
};
