import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../services/auth/auth';
import { jwtDecode } from 'jwt-decode';
import { UserData } from '../../models/auth';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authservice = inject(Auth);
  const router = inject(Router);

  if (!authservice.isAuthenticated()) {
    router.navigate(["/"]);
    return false;
  }

  // Esperar a que el currentUser$ tenga un valor
  return authservice.currentUser$.pipe(
    take(1), // Tomar solo el primer valor emitido
    map(user => {
      if (user && user.rol === "C") {
        return true;
      }
      router.navigate(["/"]);
      return false;
    })
  );
};