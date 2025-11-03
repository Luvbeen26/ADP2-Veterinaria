import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../../services/auth/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authservice=inject(Auth)
  const token=authservice.getToken();

  if(token){
    const cloned=req.clone({
      setHeaders:{
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned)
  }
  
  return next(req);
};
