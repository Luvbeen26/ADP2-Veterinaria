import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, catchError, defer, finalize, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { login, LoginResponse, register, Token, UserData } from '../../models/auth';
import { environment } from '../../../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { apiFailure } from '../../security/api-error';
import { ZeroTrustApi } from '../../security/zero-trust-api';
import { Authenticated, MfaRequired, BACKEND_PENDING } from '../../security/contracts';

@Injectable({providedIn: 'root'})
export class Auth implements OnDestroy {
  private readonly http = inject(HttpClient);
  readonly cookies = inject(CookieService);
  private readonly router = inject(Router);
  readonly security = inject(ZeroTrustApi);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly user = new BehaviorSubject<UserData | null>(null);
  readonly currentUser$ = this.user.asObservable();
  readonly notice = signal('');
  readonly logoutResult = signal<'idle' | 'pending' | 'confirmed' | 'local-only'>('idle');
  private access: string | null = null;
  private timer?: ReturnType<typeof setTimeout>;
  private epoch = 0;
  private loginRetryUntil = 0;
  private loginRateLimit?: HttpErrorResponse;
  private registerRequest?: Observable<Token>;
  private loginRequest?: Observable<LoginResponse>;
  private mfaRequest?: Observable<Token>;
  private refreshRequest?: Observable<boolean>;
  private restored = false;
  private permissions: string[] = [];
  private mfaDeadline = 0;
  private mfaChallenge: string | null = null;
  private recovery: {email: string; challenge?: string; deadline?: number; ticket?: string; ticketDeadline?: number} | null = null;
  constructor() {
    // Old persistent JavaScript cookies are never promoted into a new trusted session.
    if (this.browser) this.cookies.delete('access_token', '/');
  }
  login(data: login): Observable<LoginResponse> {
    if (this.logoutResult() === 'pending') return throwError(() => new Error('Espera a que termine el cierre de sesión.'));
    if (this.loginRequest) return this.loginRequest;
    this.loginRequest = defer(() => {
      if (Date.now() < this.loginRetryUntil && this.loginRateLimit) {
        return throwError(() => new HttpErrorResponse({status: 429, statusText: 'Too Many Requests',
          error: this.loginRateLimit!.error, headers: this.loginRateLimit!.headers.set('Retry-After', String(Math.ceil((this.loginRetryUntil - Date.now()) / 1000)))}));
      }
      const version = ++this.epoch;
      this.mfaChallenge = null;
      const request: Observable<LoginResponse | Authenticated | MfaRequired> = this.security.loginEnabled ? this.security.login(data) : this.http.post<LoginResponse>(environment.apiurl + 'auth/login', data);
      return request.pipe(catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 429) {
          this.loginRateLimit = error;
          this.loginRetryUntil = Date.now() + (apiFailure(error).retryAfter || 60) * 1000;
        }
        return throwError(() => error);
      }), map((response): LoginResponse => {
        if (version !== this.epoch) throw new Error('La solicitud de acceso fue cancelada.');
        if (!response || typeof response !== 'object') throw new Error('Respuesta de acceso inválida.');
        if ('status' in response && response.status === 'mfa_required') {
          if (typeof response.challenge_id !== 'string' || !response.challenge_id || !Array.isArray(response.methods) || !response.methods.includes('totp') || !Number.isFinite(response.expires_in) || response.expires_in <= 0) throw new Error('Desafío de verificación inválido.');
          this.mfaChallenge = response.challenge_id;
          this.mfaDeadline = Date.now() + response.expires_in * 1000;
          return {requires_2fa: true, mfa_token: response.challenge_id};
        }
        if (this.security.loginEnabled && (!('status' in response) || response.status !== 'authenticated')) throw new Error('La respuesta de acceso no cumple el contrato Zero Trust.');
        if ('requires_2fa' in response) {
          if (response.requires_2fa !== true || typeof response.mfa_token !== 'string' || !response.mfa_token) throw new Error('Desafío de verificación inválido.');
          this.mfaChallenge = response.mfa_token;
          this.mfaDeadline = Date.now() + 180000;
          return response;
        }
        this.accept(response as Token | Authenticated);
        return {access_token: this.access!};
      }));
    }).pipe(finalize(() => this.loginRequest = undefined), shareReplay({bufferSize: 1, refCount: true}));
    return this.loginRequest;
  }

  verifyTwoFactor(token: string, code: string): Observable<Token> {
    if (this.mfaRequest) return this.mfaRequest;
    this.mfaRequest = defer(() => {
      if (token !== this.mfaChallenge || Date.now() >= this.mfaDeadline || !/^\d{6}$/.test(code)) return throwError(() => new Error('La verificación expiró o no es válida. Vuelve a iniciar sesión.'));
      const version = this.epoch;
      return (this.security.loginEnabled ? this.security.verifyMfa(token, code) : this.http.post<Token>(environment.apiurl + 'totp/verificar-2fa', {token, code})).pipe(tap(response => {
        if (version !== this.epoch) throw new Error('La solicitud de acceso fue cancelada.');
        if (this.security.loginEnabled && (!('status' in response) || response.status !== 'authenticated')) throw new Error('La respuesta MFA no cumple el contrato Zero Trust.');
        this.accept(response);
      }));
    }).pipe(finalize(() => this.mfaRequest = undefined), shareReplay({bufferSize: 1, refCount: true}));
    return this.mfaRequest;
  }
  cancelMfa(): void {this.mfaChallenge = null; this.mfaDeadline = 0; ++this.epoch;}
  register(data: register): Observable<Token> {
    if (this.logoutResult() === 'pending') return throwError(() => new Error('Espera a que termine el cierre de sesión.'));
    if (this.registerRequest) return this.registerRequest;
    if (data.contra !== data.confirm) return throwError(() => new Error('Las contraseñas no coinciden.'));
    if (this.security.loginEnabled && Array.from(data.contra).length < 15) {
      return throwError(() => new Error('La contraseña debe tener al menos 15 caracteres.'));
    }
    if (new TextEncoder().encode(data.contra).length > 72) {
      return throwError(() => new Error('La contraseña supera el límite de 72 bytes UTF-8.'));
    }
    const body = {usuario: data.usuario ?? data.user, nombre: data.nombres, apellidos: data.apellidos,
      correo_electronico: data.correo, contra: data.contra, confirm: data.confirm};
    this.registerRequest = defer(() => {
      const version = ++this.epoch;
      const request: Observable<Token | Authenticated> = this.security.loginEnabled ? this.security.register(body) : this.http.post<Token>(environment.apiurl + 'auth/create_user', body);
      return request.pipe(tap(response => {
        if (version !== this.epoch) throw new Error('La solicitud de registro fue cancelada.');
        if (this.security.loginEnabled && (!response || !('status' in response) || response.status !== 'authenticated')) {
          throw new Error('La respuesta de registro no cumple el contrato Zero Trust.');
        }
        this.accept(response);
      }));
    }).pipe(finalize(() => this.registerRequest = undefined), shareReplay({bufferSize: 1, refCount: true}));
    return this.registerRequest;
  }
  private accept(response: Token | Authenticated, navigate = true): void {
    if (typeof response?.access_token !== 'string') throw new Error('El servidor no devolvió un token de acceso válido.');
    let claims: UserData & {id_usuario?: number; purpose?: string; token_use?: string; sub?: string; sid?: string; jti?: string; iat?: number; nbf?: number; iss?: string; aud?: string | string[]};
    try {claims = jwtDecode(response.access_token);} catch {throw new Error('El token de acceso no es válido.');}
    if (!Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000 || claims.purpose || (claims.token_use && claims.token_use !== 'access')) throw new Error('El token de acceso expiró o no es válido.');
    let user: UserData;
    let permissions: string[] = [];
    if ('status' in response && response.status === 'authenticated') {
      const result = response as Authenticated;
      if (result.status !== 'authenticated' || result.token_type !== 'bearer' || !result.session_id || !result.user || !Array.isArray(result.user.permissions) || !Number.isFinite(result.expires_in) || result.expires_in <= 0) throw new Error('Respuesta de identidad inválida.');
      const identity = result.user;
      if (claims.token_use !== 'access' || claims.sid !== result.session_id || claims.sub !== String(identity.id_usuario) || !claims.jti || !Number.isFinite(claims.iat) || !Number.isFinite(claims.nbf) || claims.nbf! > Date.now()/1000 || !claims.iss || !claims.aud) throw new Error('Los claims de acceso no cumplen el contrato seguro.');
      permissions = identity.permissions.filter(p => typeof p === 'string');
      user = {id: identity.id_usuario, usuario: identity.usuario, nombre: identity.nombre, apellidos: identity.apellidos,
        correo: identity.correo_electronico, rol: identity.rol, twofa_habilitado: identity.twofa_habilitado,
        exp: Math.min(claims.exp, Date.now() / 1000 + result.expires_in)};
      this.security.acceptCsrf(result.csrf_token);
    } else user = {...claims, id: claims.id_usuario ?? claims.id};
    if (!['C', 'V'].includes(user.rol) || !Number.isInteger(user.id) || user.id <= 0) throw new Error('La identidad de acceso no es válida.');
    this.permissions = permissions;
    this.access = response.access_token;
    this.user.next(user);
    this.mfaChallenge = null;
    this.notice.set('');
    this.logoutResult.set('idle');
    this.scheduleExpiry();
    if (navigate) void this.router.navigate([user.rol === 'V' ? '/vet' : '/']);
  }
  private scheduleExpiry(): void {
    clearTimeout(this.timer);
    if (!this.browser || !this.user.value) return;
    const delay = this.user.value.exp * 1000 - Date.now();
    this.timer = setTimeout(() => {
      if (delay > 2147480000) this.scheduleExpiry();
      else if (this.security.sessionEnabled) this.refresh().subscribe(ok => {if (!ok) this.invalidate('La sesión expiró. Inicia sesión nuevamente.');});
      else this.invalidate('La sesión expiró. Inicia sesión nuevamente.');
    }, Math.max(0, Math.min(delay, 2147480000)));
  }
  restore(): Observable<boolean> {
    if (this.isAuthenticated()) return of(true);
    if (this.refreshRequest) return this.refreshRequest;
    if (!this.security.sessionEnabled || this.restored || !this.browser) return of(false);
    this.restored = true;
    return this.refresh();
  }
  refresh(): Observable<boolean> {
    if (!this.security.sessionEnabled) return of(false);
    if (this.refreshRequest) return this.refreshRequest;
    const version = this.epoch;
    return this.refreshRequest = this.security.refresh().pipe(map(response => {
      if (version !== this.epoch) return false;
      this.accept(response, false); return true;
    }), catchError(error => {
      if (version === this.epoch && error instanceof HttpErrorResponse && error.status === 401) {
        this.invalidate('La sesión caducó o fue revocada. Inicia sesión nuevamente.');
      }
      return of(false);
    }), finalize(() => this.refreshRequest = undefined), shareReplay({bufferSize: 1, refCount: false}));
  }
  getToken(): string | null {return this.access;}
  getSessionGeneration(): number {return this.epoch;}
  getCurrentUser(): UserData | null {return this.user.value;}
  setTwoFactorEnabled(enabled: boolean): void {
    const current = this.user.value;
    if (current) this.user.next({...current, twofa_habilitado: enabled});
  }
  isAuthenticated(): boolean {return !!this.access && !!this.user.value && this.user.value.exp > Date.now() / 1000;}
  get_userRol(): string | null {return this.isAuthenticated() ? this.user.value?.rol ?? null : null;}
  hasPermission(permission: string): boolean {return this.security.loginEnabled && this.isAuthenticated() && this.permissions.includes(permission);}
  invalidate(message = ''): void {
    this.restored = true;
    ++this.epoch; clearTimeout(this.timer); this.access = null; this.permissions = [];
    this.mfaChallenge = null; this.recovery = null; this.user.next(null); this.security.clear(); this.notice.set(message);
    if (this.browser) {this.cookies.delete('access_token', '/'); void this.router.navigate(['/auth/login']);}
  }
  logout(): void {
    if (this.logoutResult() === 'pending') return;
    this.logoutResult.set(this.security.sessionEnabled ? 'pending' : 'local-only');
    if (this.security.sessionEnabled) {
      this.security.logout().subscribe({
        next: () => {this.logoutResult.set('confirmed'); this.notice.set(this.logoutMessage());},
        error: () => {this.logoutResult.set('local-only'); this.notice.set(this.logoutMessage());}
      });
    }
    // Always clear local access immediately, but never describe that as a confirmed revocation.
    this.invalidate(this.logoutMessage());
    void this.router.navigate(['/']);
  }
  private logoutMessage(): string {
    if (this.logoutResult() === 'confirmed') return 'Cierre de sesión confirmado por el servidor.';
    if (this.logoutResult() === 'pending') return 'Acceso local cerrado. Confirmando el cierre en el servidor…';
    return 'Acceso cerrado solo en este navegador. No se confirmó la revocación en el servidor; una recarga podría restaurar la sesión.';
  }
  send_email(email: string): Observable<unknown> {
    return defer(() => {
      this.recovery = null;
      return this.security.enabled ? this.security.sendCode(email).pipe(tap(r => {
        if (typeof r.challenge_id !== 'string' || !r.challenge_id || !Number.isFinite(r.expires_in) || r.expires_in <= 0) throw new Error('Respuesta de recuperación inválida.');
        this.recovery = {email, challenge: r.challenge_id, deadline: Date.now() + r.expires_in * 1000};
      })) : this.http.post<{success?: boolean}>(environment.apiurl + 'auth/send_code', {email}).pipe(tap(r => {
        if (r.success !== true) throw new Error('No se pudo enviar el código de recuperación.');
        this.recovery = {email};
      }));
    });
  }
  recoveryEmail(): string {return this.recovery?.email ?? '';}
  canResetPassword(): boolean {return !!this.recovery?.ticket && (this.recovery.ticketDeadline ?? 0) > Date.now();}
  check_code(code: string, email: string): Observable<unknown> {
    return defer(() => {
      const recovery = this.recovery;
      if (!recovery || recovery.email !== email || !/^\d{6}$/.test(code)) return throwError(() => new Error('Reinicia la recuperación de contraseña.'));
      if (!this.security.enabled) return this.http.post<{msg: string}>(environment.apiurl + 'auth/enter_code', {email, code}).pipe(tap(r => {
        if (r.msg !== 'bien') throw new Error('No se pudo verificar el código.');
      }));
      if (!recovery.challenge || (recovery.deadline ?? 0) <= Date.now()) return throwError(() => new Error('El código expiró. Solicita otro.'));
      return this.security.enterCode(recovery.challenge, code).pipe(tap(r => {
        if (typeof r.reset_token !== 'string' || !r.reset_token || !Number.isFinite(r.expires_in) || r.expires_in <= 0) throw new Error('Respuesta de recuperación inválida.');
        recovery.ticket = r.reset_token; recovery.ticketDeadline = Date.now() + r.expires_in * 1000;
      }));
    });
  }
  resetPassword(contra: string, confirm: string): Observable<void> {
    return defer(() => {
      if (!this.canResetPassword() || !this.security.enabled) return throwError(() => new Error(BACKEND_PENDING));
      if (contra !== confirm || contra.length < 15 || contra.length > 128) return throwError(() => new Error('Usa de 15 a 128 caracteres y confirma la misma contraseña.'));
      return this.security.resetPassword(this.recovery!.ticket!, contra, confirm).pipe(tap(() => this.invalidate('Contraseña actualizada. Inicia sesión nuevamente.')));
    });
  }
  /** Unsafe legacy endpoint is intentionally never called with email as authorization. */
  change_password(_contra: string, _email: string): Observable<never> {return throwError(() => new Error(BACKEND_PENDING));}
  ngOnDestroy(): void {clearTimeout(this.timer); this.access = null; this.recovery = null;}
}
