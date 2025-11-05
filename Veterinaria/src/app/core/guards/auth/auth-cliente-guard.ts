import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../services/auth/auth';
import { jwtDecode } from 'jwt-decode';
import { UserData } from '../../models/auth';
import { map, take } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  
  if (!isPlatformBrowser(platformId)) {
    return true;
  }


  const authservice = inject(Auth);
  const router = inject(Router);

  // Validación síncrona inmediata
  const isAuth = authservice.isAuthenticated();
  const rol = authservice.get_userRol();

  if (!isAuth || rol !== 'C') {
    router.navigate(['/']);
    return false;
  }

  return true;
};