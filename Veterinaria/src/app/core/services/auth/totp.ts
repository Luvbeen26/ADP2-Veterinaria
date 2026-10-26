import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TwoFactorConfigResponse } from '../../models/auth';

@Injectable({
  providedIn: 'root'
})
export class Totp {
  private readonly api = `${environment.apiurl}totp`;

  constructor(private readonly http: HttpClient) {}

  public configurar(): Observable<TwoFactorConfigResponse> {
    return this.http.post<TwoFactorConfigResponse>(`${this.api}/configurar`, {});
  }

  public confirmar(code: string): Observable<void> {
    return this.http.post<void>(`${this.api}/confirmar`, { code });
  }

  public desactivar(password: string): Observable<void> {
    return this.http.post<void>(`${this.api}/desactivar`, { "contrasena":password });
  }

  public have2fa(): Observable<boolean> {
    return this.http.get<{ Habilitado?: boolean; habilitado?: boolean }>(
      `${this.api}/have2fa`
    ).pipe(
      map(response => response.Habilitado ?? response.habilitado ?? false)
    );
  }
}
