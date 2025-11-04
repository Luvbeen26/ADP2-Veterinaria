import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { login, register, Token, UserData } from '../../models/auth';
import { environment } from '../../../../environments/environment';
import { jwtDecode } from 'jwt-decode';



@Injectable({
  providedIn: 'root'
})
export class Auth {
  private api=environment.apiurl
  
  private currentUserSubject = new BehaviorSubject<UserData | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http:HttpClient, public cookies:CookieService){
        this.loadUserFromCookie();

  }

  public login(data:login): Observable<Token>{

    return this.http.post<Token>(`${this.api}auth/login`,data).pipe(
      tap(response=>{
        this.cookies.set('access_token',response.access_token);
        const userdata=this.decodeToken(response.access_token);
        if(userdata){
          this.currentUserSubject.next(userdata);
        }

      })
    );
  }

  public register(regis:register):Observable<Token>{
  
    return this.http.post<Token>(`${this.api}auth/create_user`,regis).pipe(
      tap(response=>{
        this.cookies.set('access_token',response.access_token);
        const userdata=this.decodeToken(response.access_token);
        if(userdata){
          this.currentUserSubject.next(userdata);
        }

      })
    )
  }



  private decodeToken(token:string):UserData | null{
    try{  
      const decode=jwtDecode<UserData>(token);
      return decode;
    }catch(error){
      console.error("Error al codificar: ",error);
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

  public getToken():string | null{
    return this.cookies.get("access_token") || null;
  }

  public getCurrentUser(): UserData | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
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
    this.cookies.delete('access_token', '/');
    this.currentUserSubject.next(null);
  }

  public get_userRol():string | null{
    const user = this.getCurrentUser();
    return user ? user.rol : null;
  }
}
