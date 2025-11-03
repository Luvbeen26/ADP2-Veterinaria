import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../services/auth/auth';
import { inject } from '@angular/core';

export const authClienteGuard: CanActivateFn = (route, state) => {
  const authservice = inject(Auth);
  const router=inject(Router);

  if(authservice.get_userRol() === "C"){
    return true
  }

  router.navigate(["/"])
  return false;
};
