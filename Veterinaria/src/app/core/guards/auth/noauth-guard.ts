import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../services/auth/auth';

export const noauthGuard: CanActivateFn = (route, state) => {
const platformId = inject(PLATFORM_ID);
  
  if (!isPlatformBrowser(platformId)) {
    return true;
  }


  const authservice = inject(Auth);
  const router = inject(Router);

  // Validación síncrona inmediata
  const isAuth = authservice.isAuthenticated();
  const rol = authservice.get_userRol();
  if (!isAuth) {
    return true;
  }
  

  
  if (rol === 'V') {
    router.navigate(["/vet"]);
    return false;
  }

  if (rol === 'C') {
    router.navigate(['']);
    return false;
  }
  
  return true
};
