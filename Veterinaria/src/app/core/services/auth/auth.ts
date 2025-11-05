import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ChangePassword, Entercode, login, register, Token, UserData } from '../../models/auth';
import { environment } from '../../../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private api = environment.apiurl;
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;

  private currentUserSubject = new BehaviorSubject<UserData | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, public cookies: CookieService) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      this.loadUserFromCookie();
    }
  }

  public login(data: login): Observable<Token> {
    return this.http.post<Token>(`${this.api}auth/login`, data).pipe(
      tap(response => {
        if (this.isBrowser) { // ← FALTABA: Solo en navegador
          this.cookies.set('access_token', response.access_token, {
            path: '/',
            sameSite: 'Lax',
            secure: false
          });
          const userdata = this.decodeToken(response.access_token);
          if (userdata) {
            this.currentUserSubject.next(userdata);
          }
        }
      })
    );
  }

  public register(regis: register): Observable<Token> {
    return this.http.post<Token>(`${this.api}auth/create_user`, regis).pipe(
      tap(response => {
        if (this.isBrowser) { // ← FALTABA: Solo en navegador
          this.cookies.set('access_token', response.access_token, {
            path: '/',
            sameSite: 'Lax',
            secure: false
          });
          const userdata = this.decodeToken(response.access_token);
          if (userdata) {
            this.currentUserSubject.next(userdata);
          }
        }
      })
    );
  }

  public send_email(correo: string): Observable<String> {
    return this.http.post<string>(`${this.api}auth/send_code`, { email: correo });
  }

  public check_code(code: string, email: string): Observable<Entercode> {
    const body: Entercode = { "email": email, "code": code };
    return this.http.post<Entercode>(`${this.api}auth/enter_code`, body);
  }

  public change_password(contra: string, email: string): Observable<ChangePassword> {
    const body: ChangePassword = { "contra": contra, "email": email };
    return this.http.patch<ChangePassword>(`${this.api}auth/update_password`, body);
  }

  private decodeToken(token: string): UserData | null {
    try {
      const decode = jwtDecode<UserData>(token);
      return decode;
    } catch (error) {
      console.error("Error al decodificar: ", error);
      return null;
    }
  }

  private loadUserFromCookie() {
    const token = this.getToken();
    if (token) {
      const userData = this.decodeToken(token);
      if (userData) {
        this.currentUserSubject.next(userData);
      }
    }
  }

  public getToken(): string | null {
    if (!this.isBrowser) return null; // ← FALTABA: Protección en servidor
    return this.cookies.get("access_token") || null;
  }

  public getCurrentUser(): UserData | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
    if (!this.isBrowser) return false; // ← FALTABA: Protección en servidor
    
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const decoded = jwtDecode<UserData>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp ? decoded.exp > currentTime : true;
    } catch {
      return false;
    }
  }

  public logout() {
    if (this.isBrowser) { // ← FALTABA: Solo en navegador
      this.cookies.delete('access_token', '/');
      this.currentUserSubject.next(null);
    }
  }

  public get_userRol(): string | null {
    if (!this.isBrowser) return null;
    
    const user = this.getCurrentUser();
    return user ? user.rol : null;
  }
}