import { CanActivateFn } from '@angular/router';

export const authVeterinarioGuard: CanActivateFn = (route, state) => {
  return true;
};
