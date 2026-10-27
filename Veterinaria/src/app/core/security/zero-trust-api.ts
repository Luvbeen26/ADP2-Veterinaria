import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, finalize, map, Observable, of, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Authenticated, AuditEvent, AuditQuery, BACKEND_PENDING, Identity, MfaRequired, ReauthAction, ReauthProof, RemoteSession, ZERO_TRUST_ENABLED, ZERO_TRUST_LOGIN_ENABLED, ZERO_TRUST_SESSION_ENABLED, ZERO_TRUST_AUDIT_ENABLED, ZERO_TRUST_MFA_SETUP_ENABLED } from './contracts';

@Injectable({providedIn: 'root'})
export class ZeroTrustApi {
  readonly enabled = inject(ZERO_TRUST_ENABLED);
  readonly loginEnabled = inject(ZERO_TRUST_LOGIN_ENABLED) || this.enabled;
  readonly sessionEnabled = inject(ZERO_TRUST_SESSION_ENABLED) || this.enabled;
  readonly auditEnabled = inject(ZERO_TRUST_AUDIT_ENABLED) || this.enabled;
  readonly mfaSetupEnabled = inject(ZERO_TRUST_MFA_SETUP_ENABLED) || this.enabled;
  private readonly http = inject(HttpClient);
  private csrf: string | null = null;
  private bootstrap?: Observable<string>;
  private readonly base = environment.apiurl;
  clear(): void { this.csrf = null; }
  acceptCsrf(value: string): void { if (typeof value !== 'string' || !value) throw new Error('Respuesta de seguridad inválida.'); this.csrf = value; }
  private gate<T>(request: () => Observable<T>, available = this.enabled): Observable<T> {
    return defer(() => available ? request() : throwError(() => new Error(BACKEND_PENDING)));
  }
  private csrfToken(): Observable<string> {
    if (this.csrf) return of(this.csrf);
    return this.bootstrap ??= this.http.get<{csrf_token: string}>(this.base + 'auth/csrf', {withCredentials: true}).pipe(
      map(r => { this.acceptCsrf(r.csrf_token); return r.csrf_token; }),
      finalize(() => this.bootstrap = undefined), shareReplay({bufferSize: 1, refCount: false}));
  }
  private cookiePost<T>(path: string, body: unknown, available = this.enabled): Observable<T> {
    return this.gate(() => this.csrfToken().pipe(switchMap(csrf => this.http.post<T>(this.base + path, body,
      {withCredentials: true, headers: {'X-CSRF-Token': csrf}}))), available);
  }
  login(body: {usuario_mail: string; contra: string}): Observable<Authenticated | MfaRequired> {
    // Refresh bootstrap on each explicit attempt; the in-flight GET is shared.
    return defer(() => {
      this.csrf = null;
      return this.cookiePost<Authenticated | MfaRequired>('auth/login', {usuario_mail: body.usuario_mail, contra: body.contra}, this.loginEnabled);
    });
  }
  register(body: unknown): Observable<Authenticated> {
    return defer(() => {
      this.csrf = null;
      return this.cookiePost<Authenticated>('auth/create_user', body, this.loginEnabled);
    });
  }
  verifyMfa(challenge_id: string, code: string): Observable<Authenticated> {return this.cookiePost('totp/verificar-2fa', {challenge_id, code}, this.loginEnabled);}
  refresh(): Observable<Authenticated> { return this.cookiePost('auth/refresh', null, this.sessionEnabled); }
  logout(): Observable<void> {return this.cookiePost('auth/logout', null, this.sessionEnabled);}
  me(): Observable<Identity> {return this.gate(() => this.http.get<Identity>(this.base + 'auth/me'));}
  sessions(): Observable<{items: RemoteSession[]}> {return this.gate(() => this.http.get<{items: RemoteSession[]}>(this.base + 'auth/sessions'), this.sessionEnabled);}
  revoke(id: string): Observable<void> {return this.gate(() => this.http.delete<void>(this.base + 'auth/sessions/' + encodeURIComponent(id), {withCredentials: true}), this.sessionEnabled);}
  revokeAll(include_current: boolean, proof: string): Observable<void> {return this.gate(() => this.http.post<void>(this.base + 'auth/sessions/revoke-all', {include_current}, {withCredentials: true, headers: {'X-Reauth-Token': proof}}), this.sessionEnabled);}
  canReauthenticate(action: ReauthAction): boolean {
    return this.enabled || (this.sessionEnabled && action === 'sessions:revoke_all') ||
      (this.mfaSetupEnabled && action === 'mfa:configure');
  }
  reauthenticate(action: ReauthAction, resource_id: string | null, contrasena: string, code?: string): Observable<ReauthProof> {
    return this.gate(() => this.http.post<ReauthProof>(this.base + 'auth/reauthenticate', {action, resource_id, contrasena, ...(code ? {code} : {})}), this.canReauthenticate(action));
  }
  sendCode(email: string): Observable<{message: string; challenge_id: string; expires_in: number}> {
    return this.gate(() => this.http.post<{message: string; challenge_id: string; expires_in: number}>(this.base + 'auth/send_code', {email}));
  }
  enterCode(challenge_id: string, code: string): Observable<{reset_token: string; expires_in: number}> {
    return this.gate(() => this.http.post<{reset_token: string; expires_in: number}>(this.base + 'auth/enter_code', {challenge_id, code}));
  }
  resetPassword(reset_token: string, contra: string, confirm: string): Observable<void> {
    return this.gate(() => this.http.patch<void>(this.base + 'auth/update_password', {reset_token, contra, confirm}));
  }
  password(contra: string, confirm: string, proof: string): Observable<void> {
    return this.gate(() => this.http.patch<void>(this.base + 'auth/password', {contra, confirm}, {headers: {'X-Reauth-Token': proof}}));
  }
  audit(query: AuditQuery): Observable<{items: AuditEvent[]; next_cursor: string | null}> {
    return this.gate(() => {
      if (query.limit !== undefined && (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 100)) return throwError(() => new Error('El límite debe estar entre 1 y 100.'));
      const window = Date.parse(query.to) - Date.parse(query.from);
      if (!Number.isFinite(window) || window < 0 || window > 31 * 86400000) return throwError(() => new Error('Selecciona un periodo de hasta 31 días.'));
      const params = Object.fromEntries(Object.entries(query).filter(([,v]) => v !== undefined && v !== '').map(([k,v]) => [k,String(v)]));
      return this.http.get<{items: AuditEvent[]; next_cursor: string | null}>(this.base + 'security/audit-events', {params});
    }, this.auditEnabled);
  }
}
