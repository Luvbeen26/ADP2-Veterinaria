import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Auth } from './auth';
import { Reauthentication } from '../../security/reauthentication';
import { TwoFactorConfigResponse } from '../../models/auth';

@Injectable({
  providedIn: 'root'
})
export class Totp {
  private readonly auth = inject(Auth);
  private readonly reauth = inject(Reauthentication);
  private readonly api = `${environment.apiurl}totp`;

  constructor(private readonly http: HttpClient) {}

  public configurar(): Observable<TwoFactorConfigResponse> {
    return this.auth.security.mfaSetupEnabled ? this.reauth.run('mfa:configure', null, proof => this.http.post<TwoFactorConfigResponse>(`${this.api}/configurar`, null, {headers: {'X-Reauth-Token': proof}})) : this.http.post<TwoFactorConfigResponse>(`${this.api}/configurar`, null);
  }

  public confirmar(code: string): Observable<void> {
    return this.http.post<{success: boolean; twofa_habilitado?: boolean}>(`${this.api}/confirmar`, {code}, {
      withCredentials: this.auth.security.mfaSetupEnabled
    }).pipe(map(response => {
      if (response.success !== true || (this.auth.security.mfaSetupEnabled && response.twofa_habilitado !== true)) {
        throw new Error('No se pudo confirmar MFA.');
      }
      this.auth.setTwoFactorEnabled(true);
      // Backend rotated refresh/CSRF cookies without returning a replacement access token.
      // Bootstrap CSRF from the existing endpoint before the next cookie-authenticated request.
      if (this.auth.security.mfaSetupEnabled) this.auth.security.clear();
    }));
  }

  public desactivar(password: string): Observable<void> {
    return this.auth.security.enabled ? this.reauth.run('mfa:disable', null, proof => this.http.post<void>(`${this.api}/desactivar`, null, {headers: {'X-Reauth-Token': proof}})).pipe(tap(() => this.auth.invalidate('MFA desactivado. Inicia sesión nuevamente.'))) : this.http.post<void>(`${this.api}/desactivar`, {contrasena: password});
  }

  public have2fa(): Observable<boolean> {
    return this.http.get<{ Habilitado?: boolean; twofa_habilitado?: boolean }>(
      `${this.api}/have2fa`
    ).pipe(
      map(response => {const enabled = this.auth.security.mfaSetupEnabled ? response.twofa_habilitado : response.Habilitado; if (typeof enabled !== 'boolean') throw new Error('No se pudo verificar el estado de MFA.'); this.auth.setTwoFactorEnabled(enabled); return enabled;})
    );
  }
}
