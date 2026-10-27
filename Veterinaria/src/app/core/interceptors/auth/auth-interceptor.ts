import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, switchMap, tap, throwError } from 'rxjs';
import { Auth } from '../../services/auth/auth';
import { environment } from '../../../../environments/environment';
import { apiFailure, describeApiFailure } from '../../security/api-error';

@Injectable({providedIn: 'root'})
export class SecurityFeedback {
  readonly message = signal('');
  readonly retryUntil = new Map<string, number>();
}
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const base = new URL(environment.apiurl);
  let url: URL;
  try {url = new URL(req.url);} catch {return next(req);}
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return next(req);
  const path = url.pathname.slice(base.pathname.length).replace(/^\//, '');
  const publicAuth = /^(auth\/(login|create_user|csrf|refresh|logout|send_code|enter_code|update_password)|totp\/verificar-2fa)$/.test(path);
  const auth = inject(Auth);
  const feedback = inject(SecurityFeedback);
  const key = req.method + ':' + url.pathname;
  const until = feedback.retryUntil.get(key) ?? 0;
  if (until > Date.now()) return throwError(() => new HttpErrorResponse({status: 429, error: {error: {code: 'RATE_LIMITED', retry_after_seconds: Math.ceil((until - Date.now()) / 1000)}}}));
  feedback.retryUntil.delete(key);
  const token = publicAuth ? null : auth.getToken();
  const request = token ? req.clone({setHeaders: {Authorization: `Bearer ${token}`}}) : req;
  return next(request).pipe(tap(() => {if (/^(auth\/(login|create_user)|totp\/verificar-2fa)$/.test(path)) feedback.message.set('');}), catchError(error => {
    const failure = apiFailure(error);
    if (error.status === 429) feedback.retryUntil.set(key, Date.now() + (failure.retryAfter || 60) * 1000);
    if (path !== 'auth/refresh') feedback.message.set(describeApiFailure(failure));
    const sameSession = !!token && token === auth.getToken();
    const credentialCheck = path === 'auth/reauthenticate' || path === 'totp/desactivar';
    if (sameSession && !credentialCheck && error.status === 401) {
      if (auth.security.sessionEnabled && failure.code === 'TOKEN_EXPIRED' && !req.headers.has('X-Reauth-Token')) {
        return auth.refresh().pipe(switchMap(ok => {
          if (ok) feedback.message.set('');
          if (!ok || !auth.getToken()) {auth.invalidate('La sesión expiró. Inicia sesión nuevamente.'); return throwError(() => error);}
          if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return throwError(() => error);
          const refreshed = auth.getToken();
          return next(req.clone({setHeaders: {Authorization: `Bearer ${refreshed}`}})).pipe(catchError(retryError => {
            if (retryError.status === 401 && auth.getToken() === refreshed) auth.invalidate('La sesión ya no es válida.');
            return throwError(() => retryError);
          }));
        }));
      }
      auth.invalidate(failure.message);
    } else if (sameSession && failure.code === 'ACCOUNT_RESTRICTED') auth.invalidate(failure.message);
    // 403/REAUTH_REQUIRED never retries an operation or grants a permission.
    return throwError(() => error);
  }));
};
