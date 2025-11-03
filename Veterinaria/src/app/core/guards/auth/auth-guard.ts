import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../services/auth/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authservice = inject(Auth);
  const router=inject(Router);

  if(authservice.isAuthenticated()){
    return true
  }

  router.navigate(["/"])
  return false;
};
